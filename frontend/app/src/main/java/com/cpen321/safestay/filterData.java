package com.cpen321.safestay;

import java.util.Date;

public class filterData {
    private int minPrice;
    private int maxPrice;
    private Date startdate;
    private Date enddate;
    private double minSafetyIndex;
    private double maxSafetyIndex;
    private int numberOfPeople;


    filterData(int minPrice, int maxPrice, double minSafetyIndex,double maxSafetyIndex,int numberOfPeople, Date startdate, Date enddate) {
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

    public double getMinSafetyIndex() { return minSafetyIndex; }

    public double getMaxSafetyIndex(){ return maxSafetyIndex; }

    public int getNumberOfPeople() { return numberOfPeople; }

}
