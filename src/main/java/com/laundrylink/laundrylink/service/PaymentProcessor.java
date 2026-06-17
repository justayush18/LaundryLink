package com.laundrylink.laundrylink.service;

import com.laundrylink.laundrylink.api.PaymentMethod;

public interface PaymentProcessor {
    String createTransaction(String orderId, double amount, PaymentMethod method);
}
