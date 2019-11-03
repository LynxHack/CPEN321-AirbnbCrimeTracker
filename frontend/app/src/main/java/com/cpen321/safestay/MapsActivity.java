package com.cpen321.safestay;

import com.android.volley.RetryPolicy;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.fragment.app.FragmentActivity;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.widget.Toast;

import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.VisibleRegion;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.android.libraries.places.api.Places;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.google.android.libraries.places.api.model.AutocompletePrediction;
import com.google.android.libraries.places.api.model.AutocompleteSessionToken;
import com.google.android.libraries.places.api.model.TypeFilter;
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest;
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsResponse;
import com.google.android.libraries.places.api.net.PlacesClient;
import com.mancj.materialsearchbar.MaterialSearchBar;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;

public class MapsActivity extends FragmentActivity implements OnMapReadyCallback {

    private GoogleMap mMap;
    private LocationManager locationManager;
    private PlacesClient placesClient;
    private List<AutocompletePrediction> predictionList;

    private Location mLastKnownLocation;
    private LocationCallback locationCallback;

    private MaterialSearchBar materialSearchBar;

    private LatLng currentLocation;
    private final String listingURL = "http://52.12.72.93:3000/getListing/";
    private final String googleURL = "https://maps.googleapis.com/maps/api/geocode/json?address=";
    private final String googleSearchKey = "&key=AIzaSyCvOK46FEquDa11YXuDS1STdXYu_yXQLPE";
    private List<LatLng> markerList = new ArrayList<LatLng>();
    private LatLng farLeft;
    private LatLng nearRight;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_maps);
        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        // For user's current location
        ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 1);
        userLocation();

        // Initialize Places.
        Places.initialize(MapsActivity.this, googleSearchKey);

        // Create a new Places client instance.
        placesClient = Places.createClient(this);
        final AutocompleteSessionToken token = AutocompleteSessionToken.newInstance();
        materialSearchBar = findViewById(R.id.searchBar);

        materialSearchBar.setOnSearchActionListener(new MaterialSearchBar.OnSearchActionListener() {
            @Override
            public void onSearchStateChanged(boolean enabled) {
                // Might be used when implementing search filters
            }

            @Override
            public void onSearchConfirmed(CharSequence text) {
                searchCity(text.toString());
            }

            @Override
            public void onButtonClicked(int buttonCode) {
                if (buttonCode == MaterialSearchBar.BUTTON_NAVIGATION) {
                    // To open menu for relevant filters
                }

                else if (buttonCode == MaterialSearchBar.BUTTON_BACK) {
                    materialSearchBar.disableSearch();
                }
            }
        });

        materialSearchBar.addTextChangeListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                // Most likely will be unused, but currently kept if necessity to use it pops up
            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                FindAutocompletePredictionsRequest predictionsRequest = FindAutocompletePredictionsRequest.builder()
                        .setTypeFilter(TypeFilter.CITIES).setSessionToken(token).setQuery(charSequence.toString())
                        .build();
                placesClient.findAutocompletePredictions(predictionsRequest).addOnCompleteListener(new OnCompleteListener<FindAutocompletePredictionsResponse>() {
                    @Override
                    public void onComplete(@NonNull Task<FindAutocompletePredictionsResponse> task) {
                        if (task.isSuccessful()) {
                            FindAutocompletePredictionsResponse predictionsResponse = task.getResult();

                            if (predictionsResponse != null) {
                                predictionList = predictionsResponse.getAutocompletePredictions();
                                List<String> suggestionsList = new ArrayList<>();
                                for (AutocompletePrediction prediction : predictionList) {
                                    suggestionsList.add(prediction.getFullText(null).toString());
                                }
                                materialSearchBar.updateLastSuggestions(suggestionsList);

                                if (!materialSearchBar.isSuggestionsVisible()) {
                                    materialSearchBar.showSuggestionsList();
                                }
                            }
                        }

                        else {
                            // Log error
                            System.out.println("FAILURE");
                        }
                    }
                });
            }

            @Override
            public void afterTextChanged(Editable editable) {
                // Most likely will be unused, but currently kept if necessity to use it pops up
            }
        });
    }


    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

        // If user gives permission for current location, zoom in on their coordinates
        if (currentLocation != null) {
            mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(currentLocation, 13.0f));
        }

        mMap.setOnCameraIdleListener(new GoogleMap.OnCameraIdleListener() {
            @Override
            public void onCameraIdle() {

                VisibleRegion visibleRegion = mMap.getProjection().getVisibleRegion();
                farLeft = visibleRegion.farLeft;
                nearRight = visibleRegion.nearRight;

                // Saved if request is ever switched back to POST
                /*Map<String, String> params = new HashMap<>();

                params.put("xmin", Double.toString(farLeft.longitude));
                params.put("xmax", Double.toString(nearRight.longitude));
                params.put("ymin", Double.toString(nearRight.latitude));
                params.put("ymax", Double.toString(farLeft.latitude));*/

                String url = listingURL.concat("?xmin=").concat(Double.toString(farLeft.longitude)).concat("&xmax=").concat(Double.toString(nearRight.longitude)).concat("&ymin=").concat(Double.toString(nearRight.latitude)) + "&ymax=".concat(Double.toString(farLeft.latitude));
                System.out.println(url);
                CustomRequest jsObjRequest = new CustomRequest(Request.Method.GET, url, null,
                        new Response.Listener<JSONObject>() {
                            @Override
                            public void onResponse(JSONObject response) {
                                System.out.println("RECEIVED RESPONSE" + response.toString());

                                try {
                                    JSONArray listings = response.getJSONArray("Listings");

                                    int numListings = listings.length();

                                    for (int i = 0; i < numListings; i++) {

                                        JSONObject current = listings.getJSONObject(i);

                                        LatLng coords = new LatLng(current.getDouble("lat"), current.getDouble("lng"));

                                        if (!markerList.contains(coords)) {

                                            int safety_index = current.getInt("safety_index");
                                            float markerColour;

                                            if (safety_index > 6)
                                                markerColour = BitmapDescriptorFactory.HUE_GREEN;
                                            else if (safety_index > 4)
                                                markerColour = BitmapDescriptorFactory.HUE_YELLOW;
                                            else markerColour = BitmapDescriptorFactory.HUE_RED;

                                            mMap.addMarker(new MarkerOptions().position(coords)
                                                    .title(current.getString("name")
                                                            + "\nMax Occupancy: " + current.getInt("person_capacity")
                                                            + "\nRating: " + current.getDouble("star_rating") + " Stars")
                                                    .icon(BitmapDescriptorFactory.defaultMarker(markerColour)));

                                            markerList.add(coords);
                                        }

                                    }

                                } catch (JSONException e) {
                                    //problem with receiving JSONObject
                                    //OR
                                    //problem with extracting info from JSONObject
                                    Toast.makeText(getApplicationContext(), "JSON Exception in login activity!!", Toast.LENGTH_SHORT).show();
                                    e.printStackTrace();
                                }
                            }
                        },
                        new Response.ErrorListener() {
                            @Override
                            public void onErrorResponse(VolleyError error) {
                                Toast.makeText(getApplicationContext(), "Error: " + error.toString(), Toast.LENGTH_LONG).show();
                                if (error == null || error.networkResponse == null) {
                                    return;
                                }

                                String body;
                                //get response body and parse with appropriate encoding
                                try {
                                    body = new String(error.networkResponse.data, "UTF-8");
                                    Toast.makeText(getApplicationContext(), body, Toast.LENGTH_SHORT).show();

                                } catch (UnsupportedEncodingException e) {
                                    //exception handling to be placed here
                                }
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
                        // Might implement a retry logic if connection fails within timeout range
                    }
                });

                VolleySingleton.getInstance(getApplicationContext()).addToRequestQueue(jsObjRequest);
            }
        });
    }

    private void userLocation() {

        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);

        if (ActivityCompat.checkSelfPermission(MapsActivity.this, Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(MapsActivity.this, Manifest.permission.ACCESS_COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED) {
            Location location = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            currentLocation = new LatLng(location.getLatitude(), location.getLongitude());
        }
    }

    private void searchCity(String city) {
        // Replace spaces with space ASCII code
        String searchURL = googleURL + city.replace(" ", "%20") + googleSearchKey;

        CustomRequest jsObjRequest = new CustomRequest(Request.Method.POST, searchURL, null,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        System.out.println("RECEIVED RESPONSE" + response.toString());
//
                        try {
                            JSONObject coordinates = response.getJSONArray("results").getJSONObject(0).getJSONObject("geometry").getJSONObject("location");

                            mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(new LatLng(coordinates.getDouble("lat"), coordinates.getDouble("lng")),
                                    11.5f));
                        } catch (JSONException e) {
                            //problem with receiving JSONObject
                            //OR
                            //problem with extracting info from JSONObject
                            Toast.makeText(getApplicationContext(), "Invalid city", Toast.LENGTH_SHORT).show();
                            e.printStackTrace();
                        }
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        Toast.makeText(getApplicationContext(), "Invalid city", Toast.LENGTH_SHORT).show();
                        if (error == null || error.networkResponse == null) {
                            return;
                        }

                        String body;
                        //get response body and parse with appropriate encoding
                        try {
                            body = new String(error.networkResponse.data, "UTF-8");
                            Toast.makeText(getApplicationContext(), body, Toast.LENGTH_SHORT).show();

                        } catch (UnsupportedEncodingException e) {
                            //exception handling to be placed here
                        }
                    }
                });

        VolleySingleton.getInstance(getApplicationContext()).addToRequestQueue(jsObjRequest);
    }
}
