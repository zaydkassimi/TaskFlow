package com.taskflow.repository.specification;

import com.taskflow.entity.Project;
import com.taskflow.entity.enums.ProjectStatus;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

/**
 * Composable filters for the project list endpoint. When {@code memberId} is provided the
 * result is scoped to projects the user belongs to.
 */
public final class ProjectSpecifications {

    private ProjectSpecifications() {
    }

    public static Specification<Project> withFilters(Long memberId, ProjectStatus status, String search) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (memberId != null) {
                predicates.add(criteriaBuilder.equal(root.join("members", JoinType.INNER).get("id"), memberId));
                if (query != null) {
                    query.distinct(true);
                }
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.<String>get("name")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.<String>get("description")), pattern)));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
