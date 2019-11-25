package com.cpen321.safestay;

public class filterData {
    private int minPrice;
    private int maxPrice;
    private String startdate;
    private String enddate;



    filterData(int minPrice, int maxPrice, String startdate, String enddate) {
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.startdate = startdate;
        this.enddate = enddate;

    }

    public int getMinPrice() {
        return minPrice;
    }

    public int getMaxPrice() {
        return maxPrice;
    }

    public String getStartdate() {
        return startdate;
    }

    public String getEnddate() {
        return enddate;
    }

}
