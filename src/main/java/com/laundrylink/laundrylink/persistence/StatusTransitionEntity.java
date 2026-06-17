package com.laundrylink.laundrylink.persistence;

import com.laundrylink.laundrylink.api.OrderStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "order_status_transitions")
public class StatusTransitionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private long timestamp;
    
    @Column(columnDefinition = "TEXT")
    private String notes;

    public StatusTransitionEntity() {}

    public StatusTransitionEntity(OrderStatus status, long timestamp, String notes) {
        this.status = status;
        this.timestamp = timestamp;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
