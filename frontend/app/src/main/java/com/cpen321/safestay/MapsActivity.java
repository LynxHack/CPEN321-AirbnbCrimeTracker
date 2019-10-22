package com.cpen321.safestay;

import com.android.volley.toolbox.JsonObjectRequest;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import androidx.core.app.ActivityCompat;
import androidx.fragment.app.FragmentActivity;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.widget.Toast;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.VisibleRegion;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.VolleyError;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MapsActivity extends FragmentActivity implements OnMapReadyCallback {

    private GoogleMap mMap;
    private LocationManager locationManager;
    private LatLng currentLocation;
    private final String crimesURL = "10.0.75.2:3000/crimes";
    private final String airbnbURL = "http://192.168.1.69/getlistings";
    private final String testURL = "/";
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
    }


    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

        // If user gives permission for current location, zoom in on their coordinates
        if (currentLocation != null) {
            mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(currentLocation, 13.0f));
            //searchCity();
        }

        mMap.setOnCameraIdleListener(new GoogleMap.OnCameraIdleListener() {
            @Override
            public void onCameraIdle() {

                VisibleRegion visibleRegion = mMap.getProjection().getVisibleRegion();
                farLeft = visibleRegion.farLeft;
                nearRight = visibleRegion.nearRight;

                /*Map<String, String> params = new HashMap<>();

                params.put("xmin", Double.toString(farLeft.longitude));
                params.put("xmax", Double.toString(nearRight.longitude));
                params.put("ymin", Double.toString(nearRight.latitude));
                params.put("ymax", Double.toString(farLeft.latitude));*/

                String url = "http://34.221.117.161:3000/getListing/".concat("?xmin=").concat(Double.toString(farLeft.longitude)).concat("&xmax=").concat(Double.toString(nearRight.longitude)).concat("&ymin=").concat(Double.toString(nearRight.latitude)) + "&ymax=".concat(Double.toString(farLeft.latitude));
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

    private void searchCity() {

        String city = "burnaby";

        String searchURL = googleURL + city + googleSearchKey;

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
                            Toast.makeText(getApplicationContext(), "JSON Exception in login activity!!", Toast.LENGTH_SHORT).show();
                            e.printStackTrace();
                        }
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        Toast.makeText(getApplicationContext(), "Some kind of error", Toast.LENGTH_LONG).show();
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
