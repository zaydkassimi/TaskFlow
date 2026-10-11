package com.taskflow.repository.specification;

import com.taskflow.entity.User;
import com.taskflow.entity.enums.Role;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

/**
 * Composable filters for the user list endpoint (role and free-text name/email search).
 */
public final class UserSpecifications {

    private UserSpecifications() {
    }

    public static Specification<User> withFilters(Role role, String search) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (role != null) {
                predicates.add(criteriaBuilder.equal(root.get("role"), role));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                var fullName = criteriaBuilder.lower(criteriaBuilder.concat(
                        criteriaBuilder.concat(root.<String>get("firstName"), " "),
                        root.<String>get("lastName")));
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(fullName, pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.<String>get("email")), pattern)));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
