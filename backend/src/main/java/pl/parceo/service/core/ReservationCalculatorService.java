package pl.parceo.service.core;

import pl.parceo.model.constant.DiscountType;
import pl.parceo.model.constant.Operation;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class ReservationCalculatorService {


	public BigDecimal calculate(BigDecimal cpPrice, long daysInReservation) {
		//TODO this should be stored in DB
		final var condition = new DiscountCondition(10, 3, Operation.GREATER_THEN, DiscountType.SUBTRACT_VAL);
		var finalPrice = BigDecimal.ZERO;

		for (int i = 1; i <= daysInReservation; i++) {
			final var discountedPrice = condition.doDiscount(cpPrice, i);
				finalPrice = finalPrice.add(discountedPrice);
		}

		return finalPrice;
	}

}
