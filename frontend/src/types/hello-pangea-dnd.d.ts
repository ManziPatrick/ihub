import '@hello-pangea/dnd';

declare module '@hello-pangea/dnd' {
  interface DraggingStyle {
    [index: `--${string}`]: string | number | undefined;
  }

  interface NotDraggingStyle {
    [index: `--${string}`]: string | number | undefined;
  }
}
