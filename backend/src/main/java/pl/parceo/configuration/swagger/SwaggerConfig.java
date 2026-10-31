package pl.parceo.configuration.swagger;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Component
public class SwaggerConfig {

    private static final String SEC_SCHEME_NAME = "ParceoSecurityScheme";
    private static final String SEC_SCHEME = "bearer";
    private static final String BEARER_FORMAT = "JWT";
    private static final String INFO_TITTLE = "Parceo api scheme";

    @Bean
    public OpenAPI customOpenApi() {
        var secScheme = new SecurityScheme()
                .name(SEC_SCHEME_NAME)
                .scheme(SEC_SCHEME)
                .bearerFormat(BEARER_FORMAT)
                .type(SecurityScheme.Type.HTTP);
        var components = new Components().addSecuritySchemes(SEC_SCHEME_NAME, secScheme);

        return new OpenAPI()
                .info(new Info().title(INFO_TITTLE))
                .addSecurityItem(new SecurityRequirement().addList(SEC_SCHEME_NAME))
                .components(components);
    }
}
