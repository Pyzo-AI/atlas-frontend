// Opening an answer source in a new tab hides this tab. The global chat (FloatingChatbot) ends its session
// when the tab is hidden, which would unmount the sources and cancel the link request; it skips that hide
// when a source was opened just before.
let openedAt = 0;

export const markSourceOpening = () => {
  openedAt = Date.now();
};

export const isSourceOpening = () => Date.now() - openedAt < 3000;
