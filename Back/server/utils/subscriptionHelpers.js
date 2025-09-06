export const calculateNextRenewalDate = (currentRenewalDate, billingCycle) => {
  const date = new Date(currentRenewalDate);

  switch (billingCycle) {
    case "Weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "Monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "Quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "Yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error(`Invalid billing cycle: ${billingCycle}`);
  }

  return date;
};

export const calculateMonthlyPrice = (cost, billingCycle) => {
  switch (billingCycle) {
    case "Weekly":
      return cost * 4.33; // Approximate weeks per month
    case "Monthly":
      return cost;
    case "Quarterly":
      return cost / 3;
    case "Yearly":
      return cost / 12;
    default:
      throw new Error(`Invalid billing cycle: ${billingCycle}`);
  }
};

export const calculateAnnualCost = (cost, billingCycle) => {
  switch (billingCycle) {
    case "Weekly":
      return cost * 52;
    case "Monthly":
      return cost * 12;
    case "Quarterly":
      return cost * 4;
    case "Yearly":
      return cost;
    default:
      throw new Error(`Invalid billing cycle: ${billingCycle}`);
  }
};

export const getDaysUntilRenewal = (renewalDate) => {
  const today = new Date();
  const renewal = new Date(renewalDate);
  const diffTime = Math.abs(renewal - today);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};
