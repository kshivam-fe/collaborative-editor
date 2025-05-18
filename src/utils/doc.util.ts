export function findDiff(oldStr: string, newStr: string) {
  let start = 0;
  while (
    start < oldStr.length &&
    start < newStr.length &&
    oldStr[start] === newStr[start]
  ) {
    start++;
  }

  let endOld = oldStr.length - 1;
  let endNew = newStr.length - 1;
  while (
    endOld >= start &&
    endNew >= start &&
    oldStr[endOld] === newStr[endNew]
  ) {
    endOld--;
    endNew--;
  }

  if (start > endOld && start > endNew) {
    return { start: -1, end: -1, insertedText: "" };
  }

  const insertedText = newStr.slice(start, endNew + 1);
  return { start, end: endOld + 1, insertedText };
}



export function placeCursorAtPosition(el: HTMLElement, charIndex: number) {
  const selection = window.getSelection();
  if (!selection) return;

  // Create a range
  const range = document.createRange();

  let currentNode: Node | null = null;
  let currentOffset = 0;
  let remaining = charIndex;

  // Walk the child nodes to find the exact text node and offset
  function findNodeAndOffset(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0;
      if (remaining <= textLength) {
        currentNode = node;
        currentOffset = remaining;
        return true;
      } else {
        remaining -= textLength;
      }
    } else {
      for (const child of Array.from(node.childNodes)) {
        if (findNodeAndOffset(child)) return true;
      }
    }
    return false;
  }

  findNodeAndOffset(el);

  if (currentNode) {
    range.setStart(currentNode, currentOffset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

