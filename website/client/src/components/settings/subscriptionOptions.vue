<template>
  <div id="subscription-form">
    <b-form-group class="w-100 h-100">
      <div
        v-if="editingSubscription"
      >
        <div class="d-flex flex-column justify-content-center">
          <div
            class="svg-icon color close-x ml-auto"
            aria-hidden="true"
            tabindex="0"
            @click="cancel()"
            @keypress.enter="cancel()"
            v-html="icons.close"
          ></div>
          <h2
            v-once
            class="mt-n3 mb-0"
          >
            {{ $t('editSubscription') }}
          </h2>
        </div>
        <div
          class="sub-summary d-flex justify-content-around mx-4 my-3"
        >
          <div class="text-center">
            <strong>
              {{ $t('yourSubscription') }}
            </strong>
            <div
              v-once
              class="mt-2"
              v-html="$t('giftSubscriptionRateText', {
                price: subscriptionBlocks[editingSubscription].price,
                months: subscriptionBlocks[editingSubscription].months})"
            >
            </div>
          </div>
          <div class="text-center">
            <strong>
              {{ $t('paymentMethod') }}
            </strong>
            <div
              class="svg-icon mx-auto"
              :class="paymentMethodLogo.class"
              v-html="paymentMethodLogo.icon"
            >
            </div>
          </div>
        </div>
      </div>
      <!-- eslint-disable vue/no-use-v-if-with-v-for -->
      <b-form-radio
        v-for="block in subscriptionBlocksOrdered"
        v-if="showBlock(block)"
        :key="block.key"
        v-model="subscription.key"
        :value="block.key"
        class="subscribe-option pt-2 pl-5 pb-3 mb-0"
        :class="{selected: subscription.key === block.key}"
        @click.native="updateSubscriptionData(block.key)"
      >
        <!-- eslint-enable vue/no-use-v-if-with-v-for -->
        <div
          v-if="userReceivingGift && userReceivingGift._id"
          class="subscription-text ml-2 mb-1"
          v-html="$t('giftSubscriptionRateText', {price: block.price, months: block.months})"
        >
        </div>
        <div
          v-else
          class="subscription-text ml-2 mb-1"
          v-html="$t('subscriptionRateText', {price: block.price, months: block.months})"
        >
        </div>
        <div
          class="ml-2"
          v-html="subscriptionBubbles(block.key)"
        >
        </div>
      </b-form-radio>
    </b-form-group>
    <!-- payment buttons first is for gift subs and the second is for renewing subs -->
    <payments-buttons
      v-if="userReceivingGift && userReceivingGift._id"
      :disabled="!subscription.key"
      :stripe-fn="() => redirectToStripe({gift, uuid: userReceivingGift._id, receiverName})"
      :paypal-fn="() => openPaypalGift({
        gift: gift, giftedTo: userReceivingGift._id, receiverName,
      })"
      :amazon-data="{type: 'single', gift, giftedTo: userReceivingGift._id, receiverName}"
    />
    <payments-buttons
      v-else-if="!editingSubscription"
      :disabled="!subscription.key"
      :stripe-fn="() => redirectToStripe({
        subscription: subscription.key,
        coupon: subscription.coupon,
      })"
      :paypal-fn="() => openPaypal({url: paypalPurchaseLink, type: 'subscription'})"
      :amazon-data="{
        type: 'subscription',
        subscription: subscription.key,
        coupon: subscription.coupon
      }"
    />
    <div
      v-if="editingSubscription"
    >
      <div class="small-heading">
        What happens next?
      </div>
      <ul class="small mt-2 mx-4 mb-4">
        <li>Your new plan starts today.</li>
        <li>Today and on MM/DD/YYYY, you'll be charged $X.YY + tax.</li>
        <li>
          Any remaining time on your previous subscription will convert to months of credit,
          which will extend your subscription's end date if you ever decide to cancel.
        </li>
      </ul>
      <payments-buttons
        :stripe-fn="user.purchased.plan.paymentMethod === paymentMethods.STRIPE ?
          () => redirectToStripe({
            subscription: subscription.key,
            coupon: subscription.coupon,
          }) : null"
        :paypal-fn="user.purchased.plan.paymentMethod === paymentMethods.PAYPAL ?
          () => openPaypal({
            url: paypalPurchaseLink,
            type: 'subscription',
          }) : null"
        :amazon-data="user.purchased.plan.paymentMethod === paymentMethods.AMAZON_PAYMENTS ? {
          type: 'subscription',
          subscription: subscription.key,
          coupon: subscription.coupon
        } : null"
        :editing="true"
      />
      <div
        class="cancel-link py-2"
        @click="cancelSubPrompt"
      >
        Need to cancel your subscription?
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  @import '~@/assets/scss/colors.scss';

  #subscription-form {
    .custom-control .custom-control-label::before,
    .custom-radio .custom-control-input:checked ~ .custom-control-label::after {
      margin-top: 0.75rem;
    }

    .selected {
      background-color: rgba(213, 200, 255, 0.32);

      .subscription-bubble {
        background-color: $purple-300;
        color: $white;
      }
      .subscription-text {
        color: $purple-200;
      }
    }

    .subscription-bubble, .discount-bubble {
      border-radius: 100px;
      font-size: 12px;
    }

    .subscription-bubble {
      background-color: $gray-600;
      color: $gray-200;
    }

    .discount-bubble {
      background-color: $green-10;
      color: $white;
    }
  }
</style>

<style lang="scss" scoped>
  @import '~@/assets/scss/colors.scss';

  h2 {
    color: $purple-300;
    text-align: center;
  }

  .cancel-link {
    color: $maroon-50;
    text-align: center;
    font-size: 14px;
    line-height: 1.71;
    background-color: rgba($red-500, 0.15);
    cursor: pointer;
  }

  .close-x {
    color: $gray-200;
    height: 16px;
    width: 16px;
    position: relative;
    opacity: 0.75;
    cursor: pointer;
    right: 1rem;
    top: -1rem;

    &:hover, &:focus {
      opacity: 1;
    }
  }

  .small {
    color: $gray-100;
  }

  .small-heading {
    font-size: 12px;
    font-weight: bold;
    line-height: 1.33;
    text-align: center;
    color: $gray-100;
  }

  .sub-summary {
    border-radius: 4px;
    background-color: $gray-700;
    padding: 14px;
  }

  .subscribe-option {
    background-color: $gray-700;

    &:not(:last-of-type) {
      border-bottom: 1px solid $gray-600;
    }
  }

  .svg-amazon-pay {
    width: 125px;
  }

  .svg-paypal {
    margin-top: .5rem;
    width: 90px;
  }

  .svg-stripe {
    margin-top: .25rem;
    width: 58px;
  }
</style>

<script>
import filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';

import paymentsButtons from '@/components/payments/buttons/list';

import closeIcon from '@/assets/svg/close.svg';
import amazonPayLogo from '@/assets/svg/amazonpay.svg';
import paypalLogo from '@/assets/svg/paypal-logo.svg';
import stripeLogo from '@/assets/svg/stripe.svg';
import paymentsMixin from '../../mixins/payments';
import subscriptionBlocks from '@/../../common/script/content/subscriptionBlocks';

export default {
  components: {
    paymentsButtons,
  },
  mixins: [
    paymentsMixin,
  ],
  props: {
    editingSubscription: {
      type: String,
      default: '',
    },
    userReceivingGift: {
      type: Object,
      default () {},
    },
    receiverName: {
      type: String,
      default: '',
    },
  },
  data () {
    return {
      subscription: {
        key: 'basic_earned',
      },
      gift: {
        type: 'subscription',
        subscription: { key: 'basic_earned' },
      },
      icons: Object.freeze({
        amazonPayLogo,
        close: closeIcon,
        paypalLogo,
        stripeLogo,
      }),
    };
  },
  computed: {
    subscriptionBlocks () {
      return subscriptionBlocks;
    },
    subscriptionBlocksOrdered () {
      const subscriptions = filter(subscriptionBlocks, o => o.discount !== true);
      return sortBy(subscriptions, [o => o.months]);
    },
  },
  methods: {
    subscriptionBubbles (subscription) {
      switch (subscription) {
        case 'basic_3mo':
          return '<span class="subscription-bubble px-2 py-1 mr-1">Gem cap raised to 30</span><span class="subscription-bubble px-2 py-1">+1 Mystic Hourglass</span>';
        case 'basic_6mo':
          return '<span class="subscription-bubble px-2 py-1 mr-1">Gem cap raised to 35</span><span class="subscription-bubble px-2 py-1">+2 Mystic Hourglass</span>';
        case 'basic_12mo':
          return '<span class="discount-bubble px-2 py-1 mr-1">Save 20%</span><span class="subscription-bubble px-2 py-1 mr-1">Gem cap raised to 45</span><span class="subscription-bubble px-2 py-1">+4 Mystic Hourglass</span>';
        default:
          return '<span class="subscription-bubble px-2 py-1">Gem cap at 25</span>';
      }
    },
    updateSubscriptionData (key) {
      this.subscription.key = key;
      if (this.userReceivingGift && this.userReceivingGift._id) {
        this.gift.subscription.key = key;
      }
    },
    showBlock (block) {
      if (this.editingSubscription === block.key) {
        return false;
      }
      return block.target !== 'group' && block.canSubscribe === true;
    },
    cancel () {
      this.$emit('cancel-editing');
    },
    cancelSubPrompt () {
      this.$emit('cancel-subscription');
    },
  },
};
</script>
