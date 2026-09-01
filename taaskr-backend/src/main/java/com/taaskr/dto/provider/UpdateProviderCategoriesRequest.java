package com.taaskr.dto.provider;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class UpdateProviderCategoriesRequest {
    
    @NotEmpty(message = "You must select at least one category")
    private List<Long> categoryIds;

    public UpdateProviderCategoriesRequest() {
    }

    public UpdateProviderCategoriesRequest(List<Long> categoryIds) {
        this.categoryIds = categoryIds;
    }

    public List<Long> getCategoryIds() {
        return categoryIds;
    }

    public void setCategoryIds(List<Long> categoryIds) {
        this.categoryIds = categoryIds;
    }
}
