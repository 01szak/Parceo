package pl.parceo.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "camper_place_type")
@SuperBuilder
@NoArgsConstructor
public class CamperPlaceType extends DbObject {

    @Column(name = "type_name")
    @NotNull
    private String typeName;

    @NotNull
    @Positive
    @Column(name = "price")
    private BigDecimal price;

    @OneToMany(mappedBy = "camperPlaceType", fetch = FetchType.LAZY)
    @Builder.Default
    private List<CamperPlace> camperPlaces = new ArrayList<>();

    public CamperPlaceType(String typeName, BigDecimal price) {
        this.typeName = typeName;
        this.price = price;
        this.camperPlaces = new ArrayList<>();
    }

}
