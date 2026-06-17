package com.laundrylink.laundrylink.api;

import java.util.List;

public record StakeholderProfile(String role, String description, List<String> capabilities) {
}