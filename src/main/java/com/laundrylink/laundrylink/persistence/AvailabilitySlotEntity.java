package com.laundrylink.laundrylink.persistence;

import jakarta.persistence.*;

@Entity
@Table(name = "partner_availability_slots")
public class AvailabilitySlotEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String dayOfWeek;
    private String startTime;
    private String endTime;
    private int maxOrders;

    public AvailabilitySlotEntity() {}

    public AvailabilitySlotEntity(String dayOfWeek, String startTime, String endTime, int maxOrders) {
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.maxOrders = maxOrders;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public int getMaxOrders() { return maxOrders; }
    public void setMaxOrders(int maxOrders) { this.maxOrders = maxOrders; }
}
