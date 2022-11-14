import moment from 'moment';

const DEFAULT_REMAINING_DAYS = 30;
const DEFAULT_REMAINING_DAYS_FOR_GROUP_PLAN = 2;

export default function calculateSubscriptionTerminationDate (
  nextBill, purchasedPlan, groupPlanCustomerId,
) {
  const defaultRemainingDays = !purchasedPlan.customerId
    || purchasedPlan.customerId === groupPlanCustomerId
    ? DEFAULT_REMAINING_DAYS_FOR_GROUP_PLAN : DEFAULT_REMAINING_DAYS;

  const estimatedNextBill = purchasedPlan.consecutive && purchasedPlan.consecutive.offset
    ? moment().add(purchasedPlan.consecutive.offset, 'months').endOf('month') : moment();

  const billDate = nextBill ? moment.max(nextBill, estimatedNextBill) : estimatedNextBill;
  const remaining = Math.max(moment(billDate).diff(new Date(), 'days', true), defaultRemainingDays);

  const extraMonths = Math.max(purchasedPlan.extraMonths, 0);
  const extraDays = Math.ceil(30.5 * extraMonths);

  const calculatedTerminationDate = moment().startOf('day').add({ days: remaining + extraDays });

  // If a termination date is already set, use the one further in the future
  if (purchasedPlan.dateTerminated) {
    return calculatedTerminationDate.isBefore(purchasedPlan.dateTerminated)
      ? purchasedPlan.dateTerminated : calculatedTerminationDate.toDate();
  }

  // Otherwise the calculated one
  return calculatedTerminationDate.toDate();
}
