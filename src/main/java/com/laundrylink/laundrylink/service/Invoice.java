package com.laundrylink.laundrylink.service;

import java.util.List;
import com.laundrylink.laundrylink.api.InvoiceStatus;
import com.laundrylink.laundrylink.api.OrderItemDto;

public class Invoice {
    private final String invoiceId;
    private final String orderId;
    private final String paymentId;
    private final String customerEmail;
    private final String partnerEmail;
    private final double amount;
    private final List<OrderItemDto> items;
    private volatile InvoiceStatus invoiceStatus;
    private final long generatedAt;

    public Invoice(String invoiceId, String orderId, String paymentId, String customerEmail, String partnerEmail,
                   double amount, List<OrderItemDto> items) {
        this.invoiceId = invoiceId;
        this.orderId = orderId;
        this.paymentId = paymentId;
        this.customerEmail = customerEmail;
        this.partnerEmail = partnerEmail;
        this.amount = amount;
        this.items = List.copyOf(items);
        this.invoiceStatus = InvoiceStatus.GENERATED;
        this.generatedAt = System.currentTimeMillis() / 1000L;
    }

    public String getInvoiceId() {
        return invoiceId;
    }

    public String getOrderId() {
        return orderId;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public String getPartnerEmail() {
        return partnerEmail;
    }

    public double getAmount() {
        return amount;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public InvoiceStatus getInvoiceStatus() {
        return invoiceStatus;
    }

    public void setInvoiceStatus(InvoiceStatus invoiceStatus) {
        this.invoiceStatus = invoiceStatus;
    }

    public long getGeneratedAt() {
        return generatedAt;
    }
}
