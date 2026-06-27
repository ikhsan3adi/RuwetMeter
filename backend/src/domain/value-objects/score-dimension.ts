export class ScoreDimension {
  readonly value: number

  constructor(value: number) {
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      throw new Error(`ScoreDimension must be integer 0-100, got: ${value}`)
    }
    this.value = value
  }
}
