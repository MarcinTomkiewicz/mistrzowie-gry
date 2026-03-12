export type ContactTopicOption = {
  id: number;
  value: string;
  label: string;
};

export type ContactPayload = {
  topic: string;
  topicCustom?: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phone?: string;
  message: string;
  website?: string;
};
