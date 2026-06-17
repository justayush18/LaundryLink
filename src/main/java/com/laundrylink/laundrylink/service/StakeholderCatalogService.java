package com.laundrylink.laundrylink.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.laundrylink.laundrylink.api.StakeholderProfile;

@Service
public class StakeholderCatalogService {

    private static final List<StakeholderProfile> STAKEHOLDERS = List.of(
            new StakeholderProfile(
                    "Customer",
                    "Places laundry requests and tracks orders.",
                    List.of(
                            "Register and login",
                            "Place orders",
                            "Schedule pickup and delivery",
                            "Track orders in real time",
                            "Pay online",
                            "Rate services",
                            "Confirm pickup and delivery OTPs")),
            new StakeholderProfile(
                    "Laundry Partner",
                    "Accepts work and updates service progress.",
                    List.of(
                            "Accept or reject orders",
                            "Manage services",
                            "Update order status",
                            "View earnings")),
            new StakeholderProfile(
                    "Delivery Partner",
                    "Moves orders between customers and partners.",
                    List.of(
                            "View assigned pickup requests",
                            "Accept or reject pickup assignments",
                            "Pickup and deliver orders",
                            "Update pickup and delivery status",
                            "Receive assignment notifications")),
            new StakeholderProfile(
                    "Admin",
                    "Operates and supervises the platform.",
                    List.of(
                            "Manage platform",
                            "Manage users and partners",
                            "View reports",
                            "Handle disputes")));

    public List<StakeholderProfile> stakeholders() {
        return STAKEHOLDERS;
    }
}