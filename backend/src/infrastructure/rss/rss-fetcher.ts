import { XMLParser } from "fast-xml-parser";
import type { RssFetcherPort, RawArticle } from "../../application/ports/rss-fetcher.port";
import { config } from "../../config";

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

export class RssFetcher implements RssFetcherPort {
  private feedUrls: string[];

  constructor(feedUrls?: string[]) {
    this.feedUrls = feedUrls ?? config.RSS_FEED_URLS;
  }

  async fetchAll(): Promise<RawArticle[]> {
    const results: RawArticle[] = [];

    for (const url of this.feedUrls) {
      try {
        const items = await this.parseFeed(url);
        for (const item of items) {
          try {
            const content = await this.scrapeArticle(item.link);
            results.push({
              title: item.title,
              url: item.link,
              source: item.source,
              content,
              publishedAt: new Date(item.pubDate),
            });
          } catch (err) {
            console.warn(`[RSS] Failed to scrape ${item.link}:`, err);
          }
        }
      } catch (err) {
        console.warn(`[RSS] Failed to fetch feed ${url}:`, err);
      }
    }

    return results;
  }

  private async parseFeed(url: string): Promise<RssItem[]> {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "RuwetMeter/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const xml = await res.text();
    const source = new URL(url).hostname.replace(/^www\./, "");

    const doc = xmlParser.parse(xml);
    const items: RssItem[] = [];

    // RSS 2.0
    const rssChannel = doc?.rss?.channel;
    if (rssChannel?.item) {
      const feedItems = Array.isArray(rssChannel.item)
        ? rssChannel.item
        : [rssChannel.item];
      for (const el of feedItems) {
        const title = el.title ?? "";
        const link = el.link ?? "";
        const pubDate = el.pubDate ?? "";
        if (title && link) items.push({ title, link, pubDate, source });
      }
    }

    // Atom
    const atomFeed = doc?.feed;
    if (atomFeed?.entry) {
      const feedItems = Array.isArray(atomFeed.entry)
        ? atomFeed.entry
        : [atomFeed.entry];
      for (const el of feedItems) {
        const title = el.title ?? "";
        const link =
          (typeof el.link === "string"
            ? el.link
            : el.link?.["@_href"]) ?? "";
        const pubDate =
          el.published ?? el.updated ?? "";
        if (title && link) items.push({ title, link, pubDate, source });
      }
    }

    return items;
  }

  private async scrapeArticle(url: string): Promise<string> {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RuwetMeter/1.0; +https://ruwetmeter.app)",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} scraping ${url}`);

    const html = await res.text();
    const { parseHTML } = await import("linkedom");
    const dom = parseHTML(html);
    const { Readability } = await import("@mozilla/readability");
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    return article?.textContent ?? article?.content ?? "";
  }
}
