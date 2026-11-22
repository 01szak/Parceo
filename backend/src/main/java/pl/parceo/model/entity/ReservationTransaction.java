package pl.parceo.model.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@Entity
@Table(name = "reservation_payment_transaction")
@DiscriminatorValue("RESERVATION_PAYMENT")
public class ReservationTransaction extends Transaction {

    @NotNull
    @ManyToOne
    @JoinColumn(name = "reservation_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Reservation reservation;
}
