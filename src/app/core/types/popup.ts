export type PopupTargetEvent = Event;

export type BasePopupOptions = {
  message: string;
  acceptLabel: string;
  icon?: string;
  acceptIcon?: string;
  accept?: () => void;
};

export type DecisionPopupOptions = BasePopupOptions & {
  rejectLabel: string;
  reject?: () => void;
};
