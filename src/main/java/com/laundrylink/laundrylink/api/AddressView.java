package com.laundrylink.laundrylink.api;

public record AddressView(String label, String line1, String city, String state, String postalCode, boolean primary) {
}