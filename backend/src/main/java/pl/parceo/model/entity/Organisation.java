package pl.parceo.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "organisation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Organisation extends DbObject {

    @NotNull
    @OneToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    @NotBlank
    @Column(name = "organisation_name")
    private String organisationName;

    @NotBlank
    @Column(name = "address")
    private String address;

    @NotBlank
    @Column(name = "web_app_api_key", nullable = false)
    private String webAppApiKey;

}
