package com.cpen321.safestay;

import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;

public class AirbnbRental {

    private Integer id;
    private LatLng latLng;
    private String name;
    private double rating;
    private int reviewCount;
    private int capacity;
    private String url;
    private int safetyIndex;
    private Marker marker;


    AirbnbRental(Integer id, LatLng latLng, String name, double rating, int reviewCount, int capacity, String url, int safetyIndex, Marker marker) {
        this.id = id;
        this.latLng = latLng;
        this.name = name;
        this.rating = rating;
        this.reviewCount = reviewCount;
        this.capacity = capacity;
        this.url = url;
        this.safetyIndex = safetyIndex;
        this.marker = marker;
    }

    public Integer getId() {
        return id;
    }

    public LatLng getLatLng() {
        return latLng;
    }

    public String getName() {
        return name;
    }

    public double getRating() {
        return rating;
    }

    public int getReviewCount() {
        return reviewCount;
    }

    public int getCapacity() {
        return capacity;
    }

    public String getURL() {
        return url;
    }

    public int getSafetyIndex() {
        return safetyIndex;
    }

    public Marker getMarker() {
        return marker;
    }
}
