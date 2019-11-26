package com.cpen321.safestay;

import android.content.Context;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.VolleyError;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FavouriteAirbnbs {

    private List<Integer> favourites;
    private String userId;
    private final String favouriteURL = "http://ec2-54-213-225-200.us-west-2.compute.amazonaws.com:3000/favourites/";
    private final String favouriteQuery = "http://ec2-54-213-225-200.us-west-2.compute.amazonaws.com:3000/favourites?";

    public FavouriteAirbnbs(String userId, Context parentContext) {

        this.userId = userId;
        favourites = new ArrayList<Integer>();
        final Context context = parentContext;

        Map<String, String> params = new HashMap<>();
        params.put("userId", userId);
        String url = favouriteQuery + "userId=" + userId;

        CustomRequest jsObjRequest = new CustomRequest(Request.Method.GET, url, params,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        System.out.println("RECEIVED RESPONSE" + response.toString());
//
                        try {
                            //JSONObject coordinates = response.getJSONArray("results").getJSONObject(0).getJSONObject("geometry").getJSONObject("location");
                            JSONArray favouritesArray = response.getJSONArray("Listings");

                            int length = favouritesArray.length();

                            for (int i = 0; i < length; i++) {
                                favourites.add(favouritesArray.getInt(i));
                            }

                        } catch (JSONException e) {
                            //problem with receiving JSONObject
                            //OR
                            //problem with extracting info from JSONObject
                            Toast.makeText(context, "Failed to parse Favourite rentals!", Toast.LENGTH_SHORT).show();
                        }
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {

                        try {
                            Toast.makeText(context, "Failed to retrieve Favourite rentals!\nError: " + error.toString(), Toast.LENGTH_SHORT).show();

                        } catch (Exception e) {
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
        String url = favouriteQuery + "userId=" + userId + "&airbnbId=" + rentalId;
        final Integer rental = rentalId;
        final Context context = parentContext;

        CustomRequest jsObjRequest = new CustomRequest(Request.Method.DELETE, url, params,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        System.out.println("Airbnb removed");

                        try {
                            Toast.makeText(context, "Rental unfavourited!", Toast.LENGTH_SHORT).show();
                        } catch (Exception e) {
                            System.out.println("Failed to toast remove success");
                        }
                        favourites.remove(rental);
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        Toast.makeText(context, "Could not remove favourite!\nError: " + error.toString(), Toast.LENGTH_SHORT).show();
                    }
                });

        VolleySingleton.getInstance(parentContext).addToRequestQueue(jsObjRequest);

        //favourites.remove(rentalId);
    }

    public boolean isFavourite(Integer rentalId) {
        return favourites.contains(rentalId);
    }

}
