package pl.parceo.model.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.annotation.Nullable;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;


@Entity
@Table(name = "camper_place")
@Getter
@Setter
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class CamperPlace extends DbObject {

    @Column(name = "number")
    @NotNull
    private String index;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "camper_place_type_id", nullable = false)
    private CamperPlaceType camperPlaceType;

    public void setCamperPlaceType(CamperPlaceType type) {
        this.camperPlaceType = type;
        if (type != null && !type.getCamperPlaces().contains(this)) {
            type.getCamperPlaces().add(this);
        }
    }

    @Positive
    @Nullable
    @Column(name = "price")
    private BigDecimal price;

    @OneToMany(mappedBy = "camperPlace", fetch = FetchType.LAZY, cascade = {
            CascadeType.DETACH,
            CascadeType.MERGE,
            CascadeType.PERSIST,
            CascadeType.REFRESH,
    })
    @JsonManagedReference("camperPlace-reservations")
    private List<Reservation> reservations;

    public BigDecimal getPrice() {
        return price == null ? camperPlaceType.getPrice() : price;
    }

    public Optional<BigDecimal> getOverriddenPrice() {
        return Optional.ofNullable(price);
    }
}
