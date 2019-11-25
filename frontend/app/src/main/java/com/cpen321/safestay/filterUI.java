package com.cpen321.safestay;

//package org.florescu.android.rangeseekbar.sample;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;

import org.florescu.android.rangeseekbar.RangeSeekBar;

import java.util.Date;


public class filterUI extends BottomSheetDialogFragment {

    /**
     * Called when the activity is first created.
     */
    private filterData filterData;
    private RangeSeekBar safeBar;
    private RangeSeekBar priceBar;
    private RangeSeekBar peopleBar;
    private Context parentContext;
    filterUI (filterData filterData, Context parentContext) {
        this.filterData = filterData;
        this.parentContext = parentContext;
    }
    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {

        View v = inflater.inflate(R.layout.filter_ui, container, false);
        Button filterButton = v.findViewById(R.id.filter);
        filterButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                safeBar = v.findViewById(R.id.safetyIndex_slider);
                double minSafetyIndex = safeBar.getSelectedMinValue().doubleValue();
                double maxSafetyIndex = safeBar.getSelectedMaxValue().doubleValue();
                priceBar = v.findViewById(R.id.priceRange_slider);
                int minPrice = priceBar.getSelectedMinValue().intValue();
                int maxPrice = priceBar.getSelectedMaxValue().intValue();
                peopleBar = v.findViewById(R.id.numberOfOccupants_slider);
                int people = peopleBar.getSelectedMaxValue().intValue();
                Date startDate = new Date(2019, 11, 25);
                Date endDate = new Date(2019, 11, 31);
                filterData = new filterData(minPrice, maxPrice, minSafetyIndex,maxSafetyIndex, people, startDate, endDate);
                dismiss();
            }
        });
        Button resetButton = v.findViewById(R.id.filter_reset);
        resetButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Date defaultDate = new Date();
                filterData = new filterData(0,2000,1,10,1,null,null);
            }
        });

        return v;
    }


}