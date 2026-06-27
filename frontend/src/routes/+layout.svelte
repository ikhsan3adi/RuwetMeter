<script lang="ts">
  let { children } = $props();
</script>

<div class="app-shell">
  <nav class="navbar">
    <a href="/" class="logo">RuwetMeter</a>
    <div class="nav-links">
      <a href="/">Dashboard</a>
      <a href="/chat">Chat</a>
    </div>
  </nav>
  <main>
    {@render children()}
  </main>
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    background: #1e293b;
    color: #fff;
  }
  .logo {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
  }
  .nav-links {
    display: flex;
    gap: 20px;
  }
  .nav-links a {
    color: #94a3b8;
    font-size: 14px;
  }
  .nav-links a:hover {
    color: #fff;
    text-decoration: none;
  }
  main {
    flex: 1;
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
</style>
