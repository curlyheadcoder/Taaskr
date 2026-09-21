package com.taaskr.dto.routing.osrm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class OsrmResponse {
    private String code;
    private List<OsrmRoute> routes;

    public OsrmResponse() {
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public List<OsrmRoute> getRoutes() {
        return routes;
    }

    public void setRoutes(List<OsrmRoute> routes) {
        this.routes = routes;
    }
}
