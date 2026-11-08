package pl.parceo.model.entity;

import jakarta.annotation.Nullable;
import org.hibernate.validator.constraints.Length;
import pl.parceo.model.constant.ReservationStatus;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.context.annotation.Lazy;

import java.math.BigDecimal;
import java.time.LocalDate;

import static pl.parceo.model.constant.ReservationStatus.COMING;

@Entity
@Table(name = "reservation")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Reservation extends DbObject {

    @NotNull(message = "Check-in date is required")
    @Column(name = "checkin")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate checkin;

    @NotNull(message = "Check-out date is required")
    @Column(name = "checkout")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate checkout;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "camper_place_id", nullable = false)
    @Lazy
    @JsonBackReference("camperPlace-reservations")
    private CamperPlace camperPlace;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "guest_id", nullable = false)
    @Lazy
    @JsonBackReference("guest-reservations")
    private Guest guest;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ReservationStatus reservationStatus = COMING;

    @NotNull
    @Column(name = "is_paid")
    private Boolean paid = false;

    @NotNull
    @Positive
    @Column(name = "price")
    private BigDecimal price;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "creator_id")
    private User creator;

    @Nullable
    @Length(max = 500)
    @Column(name = "notes")
    private String notes;

}
