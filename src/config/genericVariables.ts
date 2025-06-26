export const notificationTypes = [
  {
    value: "INCOMMING",
    label: "Incomming",
    class: "badge-info",
    color: "#5A57EE",
  },
  {
    value: "WARNING",
    label: "Warning",
    class: "badge-warning",
    color: "#FB8C00",
  },
  {
    value: "CANCELED",
    label: "Canceled",
    class: "badge-error",
    color: "#E53935",
  },
  {
    value: "ARRIVED",
    label: "Arrived",
    class: "badge-success",
    color: "#4CAF50",
  },
  { value: "FAILED", label: "Failed", class: "badge-error", color: "#E53935" },
  {
    value: "DANGERZONE",
    label: "Danger Zone",
    class: "badge-error",
    color: "#E53935",
  },
];

export const getColor = (type: any) => {
  const tag = notificationTypes.find((t) => t.value === type);
  return tag ? tag.color : "#5A57EE"; // Color default
};
