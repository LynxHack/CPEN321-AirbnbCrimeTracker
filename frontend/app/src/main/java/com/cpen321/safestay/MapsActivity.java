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

//import com.google.android.gms.common.api.Response;
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
import java.util.HashMap;
import java.util.Map;

public class MapsActivity extends FragmentActivity implements OnMapReadyCallback {

    private GoogleMap mMap;
    private LocationManager locationManager;
    private LatLng currentLocation;
    private final String crimesURL = "10.0.75.2:3000/crimes";
    private final String airbnbURL = "http://192.168.1.69/getlistings";
    private final String testURL = "/";
    private LatLng farLeft;
    private LatLng farRight;
    private LatLng nearLeft;
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

        // Add a marker in Vancouver - notice how the markers are assigned different colours -> CAN USE THAT TO REPRESENT SAFETY
        LatLng vancouver = new LatLng(49.2827, -123.1207);
        mMap.addMarker(new MarkerOptions().position(vancouver).title("SafeStay only works in Vancouver thus far :(")
                .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_YELLOW)));
        mMap.addMarker(new MarkerOptions().position(new LatLng(49.2840, -123.0919))
                .title("The DTES is dangerous :o").icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)));
        // If user gives permission for current location, zoom in on their coordinates; else zoom in Vancouver
        if (currentLocation != null) {
            mMap.addMarker(new MarkerOptions().position(currentLocation).title("You are here!")
                .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)));
            mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(currentLocation, 13.0f));
        }

        else {
            mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(vancouver, 13.0f));
        }

        mMap.setOnCameraIdleListener(new GoogleMap.OnCameraIdleListener() {
            @Override
            public void onCameraIdle() {

                VisibleRegion visibleRegion = mMap.getProjection().getVisibleRegion();
                farLeft = visibleRegion.farLeft;
                nearRight = visibleRegion.nearRight;

                Map<String, String> params = new HashMap<>();

                params.put("xmin", Double.toString(farLeft.longitude));
                params.put("xmax", Double.toString(nearRight.longitude));
                params.put("ymin", Double.toString(nearRight.latitude));
                params.put("ymax", Double.toString(farLeft.latitude));
//                JSONObject jsonBodyObj = new JSONObject();
//                try{
//                    jsonBodyObj.put("xmin", Double.toString(farLeft.longitude));
//                    jsonBodyObj.put("xmax", Double.toString(nearRight.longitude));
//                    jsonBodyObj.put("ymin", Double.toString(nearRight.latitude));
//                    jsonBodyObj.put("ymax", Double.toString(farLeft.latitude));
//                }catch (JSONException e){
//                    e.printStackTrace();
//                }
//                final String requestBody = jsonBodyObj.toString();
//                JsonObjectRequest JOPR = new JsonObjectRequest(Request.Method.POST,
//                        airbnbURL, null, new Response.Listener<JSONObject>(){
//                    @Override
//                    public void onResponse(JSONObject response) {
//                        try {
//                            // If Airbnb querying fails, Toast the reason why
//                                    /*int success = Integer.parseInt(response.getString("success"));
//
//                                    if(success == 0) {
//                                        String reason = response.getString("fail_reason");
//                                        Toast.makeText(getApplicationContext(), reason, Toast.LENGTH_SHORT).show();
//                                    }
//
//                                    // If Airbnb querying succeeds...
//                                    else {*/
//                            Toast.makeText(getApplicationContext(), "Success!", Toast.LENGTH_SHORT).show();
//
//                            //JSONObject jsonObject = response.getJSONObject("user_info");
//                            JSONArray listings = response.getJSONArray("Listings");
//
//                            int numListings = listings.length();
//
//                            for (int i = 0; i < numListings; i++) {
//
//                                JSONObject current = listings.getJSONObject(i);
//
//                                mMap.addMarker(new MarkerOptions().position(new LatLng(current.getDouble("lat"), current.getDouble("lng")))
//                                        .title(current.getString("name")
//                                                + "\nMax Occupancy: " + current.getInt("person_capacity")
//                                                + "\nRating: " + current.getDouble("star_rating") + " Stars")
//                                        .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_BLUE)));
//                            }
//                        } catch (JSONException e) {
//                                //problem with receiving JSONObject
//                                //OR
//                                //problem with extracting info from JSONObject
//                                Toast.makeText(getApplicationContext(), "JSON Exception in login activity!!", Toast.LENGTH_SHORT).show();
//                                e.printStackTrace();
//                        }
//                    }
//                }, new Response.ErrorListener() {
//                    @Override
//                    public void onErrorResponse(VolleyError error) {
//                        if (error == null || error.networkResponse == null) {
//                            return;
//                        }
//
//                        String body;
//                        //get response body and parse with appropriate encoding
//                        try {
//                            body = new String(error.networkResponse.data,"UTF-8");
//                            Toast.makeText(getApplicationContext(), body, Toast.LENGTH_SHORT).show();
//
//                        } catch (UnsupportedEncodingException e) {
//                            //exception handling to be placed here
//                        }
//                    }
//                }){
//                    @Override
//                    public Map<String, String> getHeaders(){
//                        HashMap<String, String> headers = new HashMap<String, String>();
//                        headers.put("Content-Type", "application/json");
//                        return headers;
//                    }
//
//
//                    @Override
//                    public byte[] getBody() {
//                        try {
//                            return requestBody == null ? null : requestBody.getBytes("utf-8");
//                        } catch (UnsupportedEncodingException uee) {
////                            VolleyLog.wtf("Unsupported Encoding while trying to get the bytes of %s using %s",
////                                    requestBody, "utf-8");
//                            return null;
//                        }
//                    }
//
//
//                };
//                CustomRequest jsObjRequest = new CustomRequest(Request.Method.GET, airbnbURL, params,
//                        new Response.Listener<JSONObject>() {
//                            @Override
//                            public void onResponse(JSONObject response) {
//
//                                try {
//                                    // If Airbnb querying fails, Toast the reason why
//                                    /*int success = Integer.parseInt(response.getString("success"));
//
//                                    if(success == 0) {
//                                        String reason = response.getString("fail_reason");
//                                        Toast.makeText(getApplicationContext(), reason, Toast.LENGTH_SHORT).show();
//                                    }
//
//                                    // If Airbnb querying succeeds...
//                                    else {*/
//                                    Toast.makeText(getApplicationContext(), "Success!", Toast.LENGTH_SHORT).show();
//
//                                    //JSONObject jsonObject = response.getJSONObject("user_info");
//                                    JSONArray listings = response.getJSONArray("Listings");
//
//                                    int numListings = listings.length();
//
//                                    for (int i = 0; i < numListings; i++) {
//
//                                        JSONObject current = listings.getJSONObject(i);
//
//                                        mMap.addMarker(new MarkerOptions().position(new LatLng(current.getDouble("lat"), current.getDouble("lng")))
//                                                .title(current.getString("name")
//                                                        + "\nMax Occupancy: "+ current.getInt("person_capacity")
//                                                        + "\nRating: " + current.getDouble("star_rating") + " Stars")
//                                                .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_BLUE)));
//
//                                    }
//                                    //}
//
//                                } catch (JSONException e) {
//                                    //problem with receiving JSONObject
//                                    //OR
//                                    //problem with extracting info from JSONObject
//                                    Toast.makeText(getApplicationContext(), "JSON Exception in login activity!!", Toast.LENGTH_SHORT).show();
//                                    e.printStackTrace();
//                                }
//                            }
//                        },
//                        new Response.ErrorListener() {
//                            @Override
//                            public void onErrorResponse(VolleyError error) {
//
//                                if (error == null || error.networkResponse == null) {
//                                    return;
//                                }
//
//                                String body;
//                                //get response body and parse with appropriate encoding
//                                try {
//                                    body = new String(error.networkResponse.data,"UTF-8");
//                                    Toast.makeText(getApplicationContext(), body, Toast.LENGTH_SHORT).show();
//
//                                } catch (UnsupportedEncodingException e) {
//                                    //exception handling to be placed here
//                                }
//                            }
//                        });
//                params.put("xmin", Double.toString(farLeft.longitude));
//                params.put("xmax", Double.toString(nearRight.longitude));
//                params.put("ymin", Double.toString(nearRight.latitude));
//                params.put("ymax", Double.toString(farLeft.latitude));
                String url = "http://192.168.1.69:3000/getListing/".concat("?xmin=").concat(Double.toString(farLeft.longitude)).concat("&xmax=").concat(Double.toString(nearRight.longitude)).concat("&ymin=").concat(Double.toString(nearRight.latitude))+"&ymax=".concat(Double.toString(farLeft.latitude));
                System.out.println(url);
                CustomRequest jsObjRequest = new CustomRequest(Request.Method.GET, url, null,
                        new Response.Listener<JSONObject>() {
                            @Override
                            public void onResponse(JSONObject response) {
                                System.out.println("RECEIVED RESPONSE" + response.toString());
//                                response.toString(2);
                                try {
                                    // If Airbnb querying fails, Toast the reason why
                                    /*int success = Integer.parseInt(response.getString("success"));

                                    if(success == 0) {
                                        String reason = response.getString("fail_reason");
                                        Toast.makeText(getApplicationContext(), reason, Toast.LENGTH_SHORT).show();
                                    }

                                    // If Airbnb querying succeeds...
                                    else {*/
                                        Toast.makeText(getApplicationContext(), "Success!", Toast.LENGTH_SHORT).show();

                                        //JSONObject jsonObject = response.getJSONObject("user_info");
                                        JSONArray listings = response.getJSONArray("Listings");

                                        int numListings = listings.length();

                                        for (int i = 0; i < numListings; i++) {

                                            JSONObject current = listings.getJSONObject(i);
                                            int safety_index = current.getInt("safety_index");
                                            float markerColour;

                                            if (safety_index > 6)
                                                markerColour = BitmapDescriptorFactory.HUE_GREEN;
                                            else if (safety_index > 4)
                                                markerColour = BitmapDescriptorFactory.HUE_YELLOW;
                                            else markerColour = BitmapDescriptorFactory.HUE_RED;

                                            mMap.addMarker(new MarkerOptions().position(new LatLng(current.getDouble("lat"), current.getDouble("lng")))
                                                    .title(current.getString("name")
                                                            + "\nMax Occupancy: "+ current.getInt("person_capacity")
                                                            + "\nRating: " + current.getDouble("star_rating") + " Stars")
                                                    .icon(BitmapDescriptorFactory.defaultMarker(markerColour)));

                                        }
                                    //}

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
                                    body = new String(error.networkResponse.data,"UTF-8");
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
//
//    private void thisWillBeDeleted() {
//        mMap.setOnCameraIdleListener(new GoogleMap.OnCameraIdleListener() {
//            @Override
//            public void onCameraIdle() {
//
//                VisibleRegion visibleRegion = mMap.getProjection().getVisibleRegion();
//                farLeft = visibleRegion.farLeft;
//                farRight = visibleRegion.farRight;
//                nearLeft = visibleRegion.nearLeft;
//                nearRight = visibleRegion.nearRight;
//
//                Map<String, String> params = new HashMap<>();
//
//                params.put("xmin", Double.toString(farLeft.longitude));
//                params.put("xmax", Double.toString(nearRight.longitude));
//                params.put("ymin", Double.toString(nearRight.latitude));
//                params.put("ymax", Double.toString(farLeft.latitude));
//                JsonObjectRequest JOPR = new JsonObjectRequest(Request.Method.POST,
//                        myAcitveLessonPOSTUrl, null, new Response.Listener<JSONObject>(){
//                    @Override
//                    public void onResponse(JSONObject response) {
//                        try {
//                            VolleyLog.v("Response:%n %s", response.toString(4));
//                            populateLessonDetails(myActiveLessonURLFiltered);
//                        } catch (JSONException e) {
//                            e.printStackTrace();
//                        }
//                    }
//                }, new Response.ErrorListener() {
//                    @Override
//                    public void onErrorResponse(VolleyError error) {
//                        VolleyLog.e("Error: ", error.getMessage());
//                    }
//                }){
//                    @Override
//                    public Map<String, String> getHeaders() throws AuthFailureError {
//                        HashMap<String, String> headers = new HashMap<String, String>();
//                        headers.put("Content-Type", "application/json");
//                        return headers;
//                    }
//
//
//                    @Override
//                    public byte[] getBody() {
//                        try {
//                            return requestBody == null ? null : requestBody.getBytes("utf-8");
//                        } catch (UnsupportedEncodingException uee) {
//                            VolleyLog.wtf("Unsupported Encoding while trying to get the bytes of %s using %s",
//                                    requestBody, "utf-8");
//                            return null;
//                        }
//                    }
//                CustomRequest jsObjRequest = new CustomRequest(Request.Method.GET, crimesURL, params,
//                        new Response.Listener<JSONObject>() {
//                            @Override
//                            public void onResponse(JSONObject response) {
//
//                                try {
//                                    // if log in is failed, toast the reason why
//                                    int success = Integer.parseInt(response.getString("success"));
//
//                                    if(success == 0) {
//                                        String reason = response.getString("fail_reason");
//                                        Toast.makeText(getApplicationContext(), reason, Toast.LENGTH_SHORT).show();
//                                    }
//
//                                    //if log in successful
//                                    else {
//                                        //Toast.makeText(getApplicationContext(), "Success!", Toast.LENGTH_SHORT).show();
//
//                                        JSONObject jsonObject = response.getJSONObject("user_info");
//
//                                        Toast.makeText(getApplicationContext(), jsonObject.toString(), Toast.LENGTH_SHORT).show();
//
//                                        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
//                                        SharedPreferences.Editor editor = preferences.edit();
//                                        /*editor.putString("Email", POST_username);
//                                        editor.putString("Password", POST_password);
//                                        editor.putString("Phone Number", jsonObject.getString("phone_number"));
//
//                                        editor.putString("First Name", jsonObject.getString("first_name"));
//                                        editor.putString("Last Name", jsonObject.getString("last_name"));
//                                        editor.putString("Street Number", jsonObject.getString("street_number"));
//                                        editor.putString("Street Address", jsonObject.getString("street_address"));
//                                        editor.putString("City", jsonObject.getString("city"));
//                                        editor.putString("Postal Code", jsonObject.getString("postal_code"));
//                                        editor.putString("Gender", jsonObject.getString("gender"));
//                                        editor.putString("Date of Birth", jsonObject.getString("dob"));
//                                        editor.putString("User ID", jsonObject.getString("user_id"));
//                                        editor.putString("Passport ID", jsonObject.getString("passport_id"));*/
//
//                                        editor.apply();
//                                        //onSuccess(POST_username);
//                                    }
//
//                                } catch (JSONException e) {
//                                    //problem with receiving JSONObject
//                                    //OR
//                                    //problem with extracting info from JSONObject
//                                    Toast.makeText(getApplicationContext(), "JSON Exception in login activity!!", Toast.LENGTH_SHORT).show();
//                                    e.printStackTrace();
//                                }
//                            }
//                        },
//                        new Response.ErrorListener() {
//                            @Override
//                            public void onErrorResponse(VolleyError error) {
//
//                                if (error == null || error.networkResponse == null) {
//                                    return;
//                                }
//
//                                String body;
//                                //get response body and parse with appropriate encoding
//                                try {
//                                    body = new String(error.networkResponse.data,"UTF-8");
//                                    Toast.makeText(getApplicationContext(), body, Toast.LENGTH_SHORT).show();
//
//                                } catch (UnsupportedEncodingException e) {
//                                    //exception handling to be placed here
//                                }
//                            }
//                        });
//
//                VolleySingleton.getInstance(getApplicationContext()).addToRequestQueue(jsObjRequest);
//            }
//        });
//    }
}
