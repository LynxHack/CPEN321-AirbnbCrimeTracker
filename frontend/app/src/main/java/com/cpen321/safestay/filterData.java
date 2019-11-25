package com.cpen321.safestay;

import java.util.Date;

public class filterData {
    private int minPrice;
    private int maxPrice;
    private Date startdate;
    private Date enddate;
    private int minSafetyIndex;
    private int maxSafetyIndex;
    private int numberOfPeople;


    filterData(int minPrice, int maxPrice, int minSafetyIndex, int maxSafetyIndex,int numberOfPeople, Date startdate, Date enddate) {
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.startdate = startdate;
        this.enddate = enddate;
        this.minSafetyIndex = minSafetyIndex;
        this.maxSafetyIndex = maxSafetyIndex;
        this.numberOfPeople = numberOfPeople;
    }

    public int getMinPrice() {
        return minPrice;
    }

    public int getMaxPrice() {
        return maxPrice;
    }

    public Date getStartdate() {
        return startdate;
    }

    public Date getEnddate() {
        return enddate;
    }

    public int getMinSafetyIndex() { return minSafetyIndex; }

    public int getMaxSafetyIndex(){ return maxSafetyIndex; }

    public int getNumberOfPeople() { return numberOfPeople; }

    public void changeMinPrice(int minPrice) {
        this.minPrice = minPrice;
    }

    public void changeMaxPrice(int maxPrice) {
        this.maxPrice = maxPrice;
    }

    public void changeMinSafetyIndex(int minSafetyIndex) {
        this.minSafetyIndex = minSafetyIndex;
    }

    public void changeMaxSafetyIndex(int maxSafetyIndex) {
        this.maxSafetyIndex = maxSafetyIndex;
    }

    public void changeCapacity(int capacity) {
        this.numberOfPeople = capacity;
    }

    public boolean meetsFilter(int price, int safetyIndex, int capacity) {

        if (price > minPrice && price < maxPrice
                && safetyIndex > minSafetyIndex && safetyIndex < maxSafetyIndex
                && capacity < numberOfPeople)
            return true;

        return false;
    }

}
