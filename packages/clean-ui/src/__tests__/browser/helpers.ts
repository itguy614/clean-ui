/** Wait `n` animation frames — for work that lands after paint, not after a tick. */
export async function frames(n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  }
}
