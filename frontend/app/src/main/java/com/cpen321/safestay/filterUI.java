package com.cpen321.safestay;

import android.content.Context;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.fragment.app.FragmentManager;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.RetryPolicy;
import com.android.volley.VolleyError;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.model.BitmapDescriptor;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.squareup.picasso.Picasso;

import org.florescu.android.rangeseekbar.RangeSeekBar;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;


public class filterUI extends BottomSheetDialogFragment {

    /**
     * Called when the activity is first created.
     */
    private filterData filterData;
    private RangeSeekBar safeBar;
    private RangeSeekBar priceBar;
    private RangeSeekBar peopleBar;
    private Context parentContext;

    private GoogleMap mMap;
    private Map<Integer, AirbnbRental> rentalMap;
    private FavouriteAirbnbs favouriteAirbnbs;
    private BitmapDescriptor icon;
    private LatLng farLeft, nearRight;
    private List<Marker> rentalMarkers;
    private Integer currentMinPrice, currentMaxPrice, currentMinSafetyIndex, currentMaxSafetyIndex, currentCapacity;
    private NotificationCompat.Builder builder;
    private String searchedCity;
    private boolean timerStarted;
    private List<AirbnbRental> rentalList;
    private boolean textChange;
    private BottomSheetDialog bottomSheet;
    private FragmentManager mapFragment;

    private final String listingURL = "http://ec2-54-213-225-200.us-west-2.compute.amazonaws.com:3000/getListing/";

    filterUI (filterData filterData, Context parentContext, GoogleMap mMap, Map<Integer, AirbnbRental> rentalMap, FavouriteAirbnbs favouriteAirbnbs,
              BitmapDescriptor icon, LatLng farLeft, LatLng nearRight, List<Marker> rentalMarkers, Integer currentMinPrice, Integer currentMaxPrice,
              Integer currentMinSafetyIndex, Integer currentMaxSafetyIndex, Integer currentCapacity, NotificationCompat.Builder builder,
              String searchedCity, boolean timerStarted, List<AirbnbRental> rentalList, BottomSheetDialog bottomSheet, FragmentManager mapFragment) {
        this.filterData = filterData;
        this.parentContext = parentContext;
        this.mMap = mMap;
        this.rentalMap = rentalMap;
        this.favouriteAirbnbs = favouriteAirbnbs;
        this.icon = icon;
        this.farLeft = farLeft;
        this.nearRight = nearRight;
        this.rentalMarkers = rentalMarkers;
        this.currentCapacity = currentCapacity;
        this.currentMaxPrice = currentMaxPrice;
        this.currentMaxSafetyIndex = currentMaxSafetyIndex;
        this.currentMinPrice = currentMinPrice;
        this.currentMinSafetyIndex = currentMinSafetyIndex;
        this.builder = builder;
        this.searchedCity = searchedCity;
        this.timerStarted = timerStarted;
        this.rentalList = rentalList;
        this.bottomSheet = bottomSheet;
        this.mapFragment = mapFragment;
        textChange = false;
    }
    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {

        View v = inflater.inflate(R.layout.filter_ui, container, false);
        Button filterButton = v.findViewById(R.id.filter);
        safeBar = v.findViewById(R.id.safetyIndex_slider);
        safeBar.setRangeValues(currentMinSafetyIndex, currentMaxSafetyIndex);
        safeBar.setSelectedMinValue(filterData.getMinSafetyIndex());
        safeBar.setSelectedMaxValue(filterData.getMaxSafetyIndex());
        priceBar = v.findViewById(R.id.priceRange_slider);
        priceBar.setRangeValues(currentMinPrice, currentMaxPrice);
        priceBar.setSelectedMinValue(filterData.getMinPrice());
        priceBar.setSelectedMaxValue(filterData.getMaxPrice());
        peopleBar = v.findViewById(R.id.numberOfOccupants_slider);
        peopleBar.setRangeValues(1, 16);
        peopleBar.setSelectedMaxValue(filterData.getNumberOfPeople());
        filterButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                safeBar = v.findViewById(R.id.safetyIndex_slider);
                priceBar = v.findViewById(R.id.priceRange_slider);
                peopleBar = v.findViewById(R.id.numberOfOccupants_slider);
                getRentals();
                dismiss();
            }
        });
        safeBar.setOnRangeSeekBarChangeListener(new RangeSeekBar.OnRangeSeekBarChangeListener() {
            @Override
            public void onRangeSeekBarValuesChanged(RangeSeekBar bar, Number minValue, Number maxValue) {
                filterData.changeMinSafetyIndex(minValue.intValue());
                filterData.changeMaxSafetyIndex(maxValue.intValue());
            }
        });
        priceBar.setOnRangeSeekBarChangeListener(new RangeSeekBar.OnRangeSeekBarChangeListener() {
            @Override
            public void onRangeSeekBarValuesChanged(RangeSeekBar bar, Number minValue, Number maxValue) {
                filterData.changeMinPrice(minValue.intValue());
                filterData.changeMaxPrice(maxValue.intValue());
            }
        });
        peopleBar.setOnRangeSeekBarChangeListener(new RangeSeekBar.OnRangeSeekBarChangeListener() {
            @Override
            public void onRangeSeekBarValuesChanged(RangeSeekBar bar, Number minValue, Number maxValue) {
                filterData.changeCapacity(maxValue.intValue());
            }
        });

        return v;
    }

    private void getRentals() {

        // Clear currently displayed rentals and markers to set new filtered ones
        for (Marker marker : rentalMarkers) {
            marker.remove();
        }

        rentalMarkers.clear();
        rentalMap.clear();
        rentalList.clear();

        String url = listingURL.concat("?xmin=").concat(Double.toString(farLeft.longitude)).concat("&xmax=").concat(Double.toString(nearRight.longitude)).concat("&ymin=").concat(Double.toString(nearRight.latitude)) + "&ymax=".concat(Double.toString(farLeft.latitude));

        // Add filter data to request
        if (filterData != null) {
            url = url.concat("&minprice=").concat(Integer.toString(filterData.getMinPrice()))
                    .concat("&maxprice=").concat(Integer.toString(filterData.getMaxPrice()))
                    .concat("&minsafety=").concat(Integer.toString(filterData.getMinSafetyIndex()))
                    .concat("&maxsafety=").concat(Integer.toString(filterData.getMaxSafetyIndex()));
        }

        CustomRequest jsObjRequest = new CustomRequest(Request.Method.GET, url, null,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {

                        try {
                            JSONArray listings = response.getJSONArray("Listings");

                            int numListings = listings.length();

                            // For number of rentals notification
                            boolean flag = true;

                            // For each Airbnb rental received from request
                            for (int i = 0; i < numListings; i++) {

                                JSONObject current = listings.getJSONObject(i);

                                // Get the coordinates and Airbnb ID
                                LatLng coords = new LatLng(current.getDouble("lat"), current.getDouble("lng"));
                                Integer id = current.getInt("id");

                                // If rental is not on the map, display it
                                if (!rentalMap.containsKey(id)) {

                                    // Fire one notification for number of rentals
                                    if (flag) {
                                        flag = false;
                                        fireNotification(numListings);
                                    }

                                    // Parse rental info
                                    String name = current.getString("name");
                                    double rating = current.getDouble("star_rating");
                                    int reviewCount = current.getInt("reviews_count");
                                    int capacity = current.getInt("person_capacity");
                                    String url = current.getJSONObject("picture").getString("picture");
                                    int safety_index = current.getInt("safetyIndex");
                                    int price = current.getJSONObject("pricing_quote").getJSONObject("rate").getInt("amount");

                                    BitmapDescriptor bitmap;

                                    // Display appropriate marker (favourite/safety colour)
                                    if (favouriteAirbnbs.isFavourite(id)) {
                                        bitmap = icon;
                                    }

                                    else {
                                        if (safety_index > 6)
                                            bitmap = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN);
                                        else if (safety_index > 4)
                                            bitmap = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_YELLOW);
                                        else  bitmap = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED);
                                    }

                                    // Design and place marker
                                    Marker marker = mMap.addMarker(new MarkerOptions().position(coords)
                                            .icon(bitmap));
                                    marker.setTag(id);

                                    rentalMarkers.add(marker);

                                    // Create new object for rental and put it in map and list
                                    AirbnbRental rental = new AirbnbRental(id, coords, name, rating, reviewCount, capacity, url, safety_index, marker, price);

                                    rentalMap.put(id, rental);
                                    if (favouriteAirbnbs.isFavourite(id)) {
                                        rentalList.add(0, rental);
                                    }
                                    else rentalList.add(rental);
                                }

                            }

                        } catch (JSONException e) {
                            //Toast.makeText(parentContext, "JSON Exception parsing Airbnb rental info!", Toast.LENGTH_SHORT).show();
                            e.printStackTrace();
                        }
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        //Toast.makeText(getApplicationContext(), "Error: " + error.toString(), Toast.LENGTH_LONG).show();
                    }
                });

        jsObjRequest.setRetryPolicy(new RetryPolicy() {
            @Override
            public int getCurrentTimeout() {
                return 100000;
            }

            @Override
            public int getCurrentRetryCount() {
                return 100000;
            }

            @Override
            public void retry(VolleyError error) throws VolleyError {
            }
        });

        VolleySingleton.getInstance(parentContext).addToRequestQueue(jsObjRequest);
    }

    private void fireNotification(int numRentals) {
        final Context context = parentContext;
        if (!timerStarted) {
            timerStarted = true;
            if (!(searchedCity == "" || searchedCity == null))
                builder.setContentText("There are " + numRentals + " Airbnb rentals in " + searchedCity + ". Hurry up and book yours!");
            else builder.setContentText("There are " + numRentals + " Airbnb rentals in Vancouver. Hurry up and book yours!");
            Timer timer = new Timer();
            timer.schedule(new TimerTask() {
                @Override
                public void run() {
                    NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);

                    // notificationId is a unique int for each notification that you must define
                    notificationManager.notify(1, builder.build());
                    timerStarted = false;
                }
            }, 5 * 1000);
        }
    }

    class CustomAdapter extends BaseAdapter {

        @Override
        public int getCount() {
            return rentalList.size();
        }

        @Override
        public Object getItem(int i) {
            return null;
        }

        private InputMethodManager imm = (InputMethodManager) parentContext.getSystemService(Context.INPUT_METHOD_SERVICE);

        @Override
        public long getItemId(int i) {

            if (!textChange) {
                imm = (InputMethodManager) parentContext.getSystemService(Context.INPUT_METHOD_SERVICE);
                textChange = true;
            }

            else textChange = false;

            if (!imm.isAcceptingText()) {
                if (bottomSheet != null)
                    bottomSheet.dismiss();
                rentalList.get(i).getMarker();
                AirbnbRental current = rentalList.get(i);
                mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(current.getLatLng(),
                        15f));
                bottomSheet = new BottomSheetDialog(current, favouriteAirbnbs, parentContext);
                bottomSheet.show(mapFragment, "test");
            }
            return rentalList.get(i).getId();
        }

        @Override
        public View getView(int i, View view, ViewGroup viewGroup) {
            View listedView = getLayoutInflater().inflate(R.layout.activity_listview, null);
            ImageView imageView = listedView.findViewById(R.id.imageView);
            TextView textView = listedView.findViewById(R.id.listTextView);

            Picasso.with(parentContext).load(rentalList.get(i).getURL()).into(imageView);
            textView.setText(rentalList.get(i).getName());

            if (favouriteAirbnbs.isFavourite(rentalList.get(i).getId())) {
                ImageView favourite = listedView.findViewById(R.id.favouriteView);
                favourite.setImageBitmap(BitmapFactory.decodeResource(parentContext.getResources(), R.drawable.ic_star_favourite));
            }

            return listedView;
        }
    }
}