import { notificationTypes } from "@/config/genericVariables";
import React from "react";

const NotificationTD = ({ type, td, className }: any) => {
  const detectNotification = (type: string, td: boolean) => {
    const notification: any = notificationTypes.find(
      (item) => item.value === type
    );

    if (td) {
      if (notification) {
        return (
          <td
            className={`uppercase badge ${
              notification.class || "badge-info"
            } font-bold mx-3 text-white ${className}`}
          >
            {notification.label || "—"}
          </td>
        );
      }

      return (
        <td
          className={`uppercase badge badge-info font-bold mx-3 ${className}`}
        >
          —
        </td>
      );
    } else {
      if (notification) {
        return (
          <span
            className={`uppercase badge ${
              notification.class || "badge-info"
            } font-bold text-white ${className}`}
          >
            {notification.label || "—"}
          </span>
        );
      }

      return (
        <span
          className={`uppercase badge badge-info font-bold ${className}`}
        >
          —
        </span>
      );
    }
  };

  return detectNotification(type, td);
};

export default NotificationTD;
