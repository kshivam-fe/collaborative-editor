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



export function placeCursorAtEnd(el: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;

  // Create a range
  const range = document.createRange();

  // Set the range to the last child node and its length (end position)
  // If the element has child nodes, try to set the range to the last text node
  if (el.lastChild) {
    if (el.lastChild.nodeType === Node.TEXT_NODE) {
      // If last child is text node, place cursor at the end of its text content
      range.setStart(el.lastChild, el.lastChild.textContent?.length || 0);
    } else {
      // If last child is element, place cursor after it
      range.setStartAfter(el.lastChild);
    }
  } else {
    // If no children, set range at position 0
    range.setStart(el, 0);
  }

  range.collapse(true);

  // Clear existing selection and set new range
  selection.removeAllRanges();
  selection.addRange(range);
}
