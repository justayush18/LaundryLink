package com.laundrylink.laundrylink.service;

import java.util.UUID;
import org.springframework.stereotype.Component;
import com.laundrylink.laundrylink.api.PaymentMethod;

@Component
public class SimulatedPaymentProcessor implements PaymentProcessor {

    @Override
    public String createTransaction(String orderId, double amount, PaymentMethod method) {
        return switch (method) {
            case UPI -> "txn_upi_" + UUID.randomUUID().toString().substring(0, 8);
            case COD -> "txn_cod_" + UUID.randomUUID().toString().substring(0, 8);
            case RAZORPAY -> "pay_rzp_" + UUID.randomUUID().toString().substring(0, 8);
        };
    }
}
