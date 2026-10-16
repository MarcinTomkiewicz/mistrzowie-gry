export type PopupTargetEvent = Pick<Event, 'currentTarget'>;

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

export type ModalDecisionPopupOptions = Omit<DecisionPopupOptions, 'accept' | 'reject'> & {
  header: string;
};
