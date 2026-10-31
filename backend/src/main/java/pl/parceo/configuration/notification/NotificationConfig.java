package pl.parceo.configuration.notification;

import co.novu.Novu;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Slf4j
@Configuration
public class NotificationConfig {

    @Value("${novu.secret-key}")
    private String novuSecretKey;
    @Value("${novu.server-url}")
    private String serverUrl;

    private static final String DEFAULT_NOVU_SERVER = "https://api.novu.co";

    //TODO Novu should be inside NotificationService to not correlate business logic with external service
    @Bean
    public Novu novu () {
        log.info("Starting to create Novu bean");
        final var finalUrl = serverUrl != null ? serverUrl : DEFAULT_NOVU_SERVER;
        log.info("Connecting to the Novu api at port: {}", finalUrl);
        try {
            final var novu = Novu.builder()
                    .secretKey(novuSecretKey)
                    .serverURL(finalUrl)
                    .build();

            log.info("Novu configured successfully");
            return novu;
        } catch (Exception e) {
            log.error("Something went wrong while trying to create Novu bean", e);
            throw e;
        }
    }

}
