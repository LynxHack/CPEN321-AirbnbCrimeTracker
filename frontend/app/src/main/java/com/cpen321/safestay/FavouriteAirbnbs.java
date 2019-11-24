package com.cpen321.safestay;

import android.content.Context;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.model.LatLng;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import androidx.constraintlayout.widget.ConstraintLayout;

public class FavouriteAirbnbs {

    private List<Integer> favourites;
    private String userId;
    private final String favouriteURL = "http://ec2-54-213-225-200.us-west-2.compute.amazonaws.com:3000/favourites/";

    public FavouriteAirbnbs(String userId, Context parentContext) {

        this.userId = userId;
        favourites = new ArrayList<Integer>();

        Map<String, String> params = new HashMap<>();
        params.put("userId", userId);

        CustomRequest jsObjRequest = new CustomRequest(Request.Method.GET, favouriteURL, params,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        System.out.println("RECEIVED RESPONSE" + response.toString());
//
                        try {
                            //JSONObject coordinates = response.getJSONArray("results").getJSONObject(0).getJSONObject("geometry").getJSONObject("location");
                            JSONArray favouritesArray = response.getJSONArray("");

                            int length = favouritesArray.length();

                            for (int i = 0; i < length; i++) {
                                favourites.add(favouritesArray.getInt(i));
                            }

                        } catch (JSONException e) {
                            //problem with receiving JSONObject
                            //OR
                            //problem with extracting info from JSONObject
                            //Toast.makeText(parentContext, "Invalid city", Toast.LENGTH_SHORT).show();
                            e.printStackTrace();
                        }
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        //Toast.makeText(getApplicationContext(), "Invalid city", Toast.LENGTH_SHORT).show();
                        if (error == null || error.networkResponse == null) {
                            return;
                        }

                        String body;
                        //get response body and parse with appropriate encoding
                        try {
                            body = new String(error.networkResponse.data, "UTF-8");
                            //Toast.makeText(getApplicationContext(), body, Toast.LENGTH_SHORT).show();

                        } catch (UnsupportedEncodingException e) {
                            //exception handling to be placed here
                        }
                    }
                });

        VolleySingleton.getInstance(parentContext).addToRequestQueue(jsObjRequest);
    }

    public void addFavourite(Integer rentalId, final Context parentContext) {

        Map<String, String> params = new HashMap<>();
        params.put("userId", userId);
        params.put("airbnbId", Integer.toString(rentalId));
        final Integer rental = rentalId;
        final Context context = parentContext;

        CustomRequest jsObjRequest = new CustomRequest(Request.Method.PUT, favouriteURL, params,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        System.out.println("Airbnb favourited");

                        try {
                            Toast.makeText(context, "Rental favourited!", Toast.LENGTH_SHORT).show();
                        } catch (Exception e) {
                            System.out.println("Failed to toast add success");
                        }
                        favourites.add(rental);
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        Toast.makeText(parentContext, "Could not favourite rental!\nError: " + error.toString(), Toast.LENGTH_SHORT).show();
                    }
                });

        VolleySingleton.getInstance(parentContext).addToRequestQueue(jsObjRequest);

        //favourites.add(rentalId);
    }

    public void removeFavourite(Integer rentalId, Context parentContext) {

        Map<String, String> params = new HashMap<>();
        params.put("userId", userId);
        params.put("airbnbId", Integer.toString(rentalId));
        final Integer rental = rentalId;
        final Context context = parentContext;

        CustomRequest jsObjRequest = new CustomRequest(Request.Method.DELETE, favouriteURL, params,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        System.out.println("Airbnb removed");

                        try {
                            Toast.makeText(context, "Rental removed!", Toast.LENGTH_SHORT).show();
                        } catch (Exception e) {
                            System.out.println("Failed to toast remove success");
                        }
                        favourites.remove(rental);
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        //Toast.makeText(getApplicationContext(), "Invalid city", Toast.LENGTH_SHORT).show();
                        if (error == null || error.networkResponse == null) {
                            return;
                        }

                        String body;
                        //get response body and parse with appropriate encoding
                        try {
                            body = new String(error.networkResponse.data, "UTF-8");
                            //Toast.makeText(getApplicationContext(), body, Toast.LENGTH_SHORT).show();

                        } catch (UnsupportedEncodingException e) {
                            //exception handling to be placed here
                        }
                    }
                });

        VolleySingleton.getInstance(parentContext).addToRequestQueue(jsObjRequest);

        //favourites.remove(rentalId);
    }

    public boolean isFavourite(Integer rentalId) {
        return favourites.contains(rentalId);
    }

}
