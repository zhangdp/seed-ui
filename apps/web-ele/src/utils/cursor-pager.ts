/**
 * 游标分页控制
 *
 * 后端日志接口（/sys/loginLog/page、/sys/operationLog/page、/sys/smsLog/page）
 * 使用的是游标分页：只认 cursor，忽略 page。
 * 约定: 第一页 cursor 为空，从第二页起用「上一页最后一条记录的 id」当游标。
 *
 * 这里维护 页码 -> 游标 的映射，让 UI 仍能按页码顺序翻页。
 */
export function useCursorPager() {
  /**
   * 页码 -> 游标（进入该页时使用的游标）
   */
  const cursors = new Map<number, number>();

  /**
   * 取进入指定页所需的游标
   */
  function cursorOf(page: number): number | undefined {
    return cursors.get(page);
  }

  /**
   * 记录下一页的游标：当前页最后一条记录的 id
   */
  function remember(page: number, list?: Array<{ id?: number }>) {
    const last = list?.[list.length - 1];
    const nextCursor = last?.id;
    if (nextCursor === undefined || nextCursor === null) {
      // 当前页为空，后面没有数据了
      cursors.delete(page + 1);
    } else {
      cursors.set(page + 1, nextCursor);
    }
  }

  return { cursorOf, remember };
}
