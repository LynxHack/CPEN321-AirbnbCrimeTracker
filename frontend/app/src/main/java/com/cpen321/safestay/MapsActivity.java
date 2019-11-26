package com.cpen321.safestay;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.ListView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.fragment.app.FragmentActivity;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.RetryPolicy;
import com.android.volley.VolleyError;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptor;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.VisibleRegion;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.android.libraries.places.api.Places;
import com.google.android.libraries.places.api.model.AutocompletePrediction;
import com.google.android.libraries.places.api.model.AutocompleteSessionToken;
import com.google.android.libraries.places.api.model.Place;
import com.google.android.libraries.places.api.model.TypeFilter;
import com.google.android.libraries.places.api.net.FetchPlaceRequest;
import com.google.android.libraries.places.api.net.FetchPlaceResponse;
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest;
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsResponse;
import com.google.android.libraries.places.api.net.PlacesClient;
import com.mancj.materialsearchbar.MaterialSearchBar;
import com.mancj.materialsearchbar.adapter.SuggestionsAdapter;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

public class MapsActivity extends FragmentActivity implements OnMapReadyCallback {

    private GoogleMap mMap;
    // private LocationManager locationManager;


    // private Location mLastKnownLocation;
    // private LocationCallback locationCallback;

    // private MaterialSearchBar materialSearchBar;
    private LocationManager locationManager;
    private PlacesClient placesClient;
    private List<AutocompletePrediction> predictionList;
    private static final String CHANNEL_ID = "channel1";
    private NotificationCompat.Builder builder;

    // private Location mLastKnownLocation;
    // private LocationCallback locationCallback;

    private MaterialSearchBar materialSearchBar;
    private View mapView;

    private LatLng currentLocation;
//    private final String listingURL = "http://192.168.1.72:3000/getListing/";
    private final String listingURL = "http://ec2-54-213-225-200.us-west-2.compute.amazonaws.com:3000/getListing/";
    private final String googleURL = "https://maps.googleapis.com/maps/api/geocode/json?address=";
    private final String googleSearchKey = "&key=AIzaSyCvOK46FEquDa11YXuDS1STdXYu_yXQLPE";
    private List<LatLng> markerList = new ArrayList<LatLng>();
    private Map<Integer, AirbnbRental> rentalMap = new HashMap<Integer, AirbnbRental>();
    private List<Marker> rentalMarkers = new ArrayList<Marker>();
    private LatLng farLeft;
    private LatLng nearRight;
    private boolean timerStarted;
    private String searchedCity = "";
    private BottomSheetDialog bottomSheet;
    private FavouriteAirbnbs favouriteAirbnbs;
    private BitmapDescriptor icon;
    private filterData filterData;
    private filterUI filterUI;
    private Integer currentMinPrice, currentMaxPrice, currentMinSafetyIndex, currentMaxSafetyIndex, currentCapacity;

    private String userId;
    private ListView list;

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

        // Design favourite icon
        Drawable drawable = getResources().getDrawable(R.drawable.ic_star_favourite);
        icon = getMarkerIconFromDrawable(drawable);

        // Save user's Google account info
        getGoogleAccountInfo();

        // Initialize Places.
        Places.initialize(getApplicationContext(), "AIzaSyAyRzP_c28cIH6EjRrn-odvb2bilILLay4");
        timerStarted = false;

        // Create a new Places client instance.
        placesClient = Places.createClient(this);
        final AutocompleteSessionToken token = AutocompleteSessionToken.newInstance();
        materialSearchBar = findViewById(R.id.searchBar);

        currentMinPrice = 0;
        currentMaxPrice = 2000;
        currentMinSafetyIndex = 0;
        currentMaxSafetyIndex = 10;
        currentCapacity = 1;
        filterData = new filterData(currentMinPrice, currentMaxPrice, currentMinSafetyIndex,currentMaxSafetyIndex, currentCapacity, null, null);

        // Initialize ListView

        materialSearchBar.setOnSearchActionListener(new MaterialSearchBar.OnSearchActionListener() {
            @Override
            public void onSearchStateChanged(boolean enabled) {
            }

            @Override
            public void onSearchConfirmed(CharSequence text) {
                //startSearch(text.toString(), true, null, true);
                searchCity(text.toString());
                searchedCity = text.toString();
            }

            @Override
            public void onButtonClicked(int buttonCode) {
                if (buttonCode == MaterialSearchBar.BUTTON_NAVIGATION) {
                    if (filterUI != null)
                        filterUI.dismiss();

                    //filterUI (filterData filterData, Context parentContext, GoogleMap mMap, HashMap<Integer, AirbnbRental> rentalMap, FavouriteAirbnbs favouriteAirbnbs,
                    //                BitmapDescriptor icon)
                    filterUI = new filterUI(filterData, getApplicationContext(), mMap, rentalMap, favouriteAirbnbs, icon, farLeft, nearRight, rentalMarkers,
                            currentMinPrice, currentMaxPrice, currentMinSafetyIndex, currentMaxSafetyIndex, currentCapacity, builder,
                            searchedCity, timerStarted);
                    filterUI.show(getSupportFragmentManager(), "test");
                }

                else if (buttonCode == MaterialSearchBar.BUTTON_BACK) {
                    materialSearchBar.disableSearch();
                }
            }
        });

        materialSearchBar.addTextChangeListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {
            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                FindAutocompletePredictionsRequest predictionsRequest = FindAutocompletePredictionsRequest.builder()
                        .setTypeFilter(TypeFilter.CITIES).setSessionToken(token).setQuery(charSequence.toString())
                        .build();
                PlacesClient placesClient = Places.createClient(MapsActivity.this);

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
                        } else {
                            // Log error
                            System.out.println("FAILURE");
                        }
                    }
                });
            }

            @Override
            public void afterTextChanged(Editable editable) {

            }
        });
        materialSearchBar.setSuggestionsClickListener(new SuggestionsAdapter.OnItemViewClickListener() {
            @Override
            public void OnItemClickListener(int position, final View v) {
                if (position >= predictionList.size()){
                    return;
                }
                AutocompletePrediction selectPrediction = predictionList.get(position);
                String suggestion = materialSearchBar.getLastSuggestions().get(position).toString();
                materialSearchBar.setText(suggestion);

                new Handler().postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        materialSearchBar.clearSuggestions();
                    }
                },500);

                InputMethodManager inputMethodManager = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
                if(inputMethodManager != null)
                    inputMethodManager.hideSoftInputFromWindow(materialSearchBar.getWindowToken(),InputMethodManager.HIDE_IMPLICIT_ONLY);
                String PlaceId = selectPrediction.getPlaceId();
                List<Place.Field> placeField = Arrays.asList(Place.Field.LAT_LNG);

                FetchPlaceRequest fetchPlaceRequest = FetchPlaceRequest.builder(PlaceId,placeField).build();
                placesClient.fetchPlace((fetchPlaceRequest)).addOnSuccessListener(new OnSuccessListener<FetchPlaceResponse>() {
                    @Override
                    public void onSuccess(FetchPlaceResponse fetchPlaceResponse) {
                        Place place = fetchPlaceResponse.getPlace();
                        Log.i("mytage","place found" + place.getName());
                        LatLng latLngOfPlace = place.getLatLng();
                        searchedCity = place.getName();
                        if(latLngOfPlace != null ){
                            mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(latLngOfPlace, 14));

                        }
                    }
                }).addOnFailureListener(new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        if (e instanceof ApiException){
                            ApiException apiException = (ApiException) e ;
                            apiException.printStackTrace();
                            int statuscode =apiException.getStatusCode();
                            Log.i("mytag","place not found: " + e.getMessage());
                            Log.i("mytag","status code:" + statuscode);
                        }

                    }
                });
            }

            @Override
            public void OnItemDeleteListener(int position, View v) {

            }
        });
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

        createNotificationChannel();

        builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_star_favourite)
                .setContentTitle("SafeStay")
                .setContentText("Don't wait! Book that Airbnb in Vancouver!")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true);

        // If user gives permission for current location, zoom in on their coordinates
        if (currentLocation != null) {
            mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(currentLocation, 13.0f));
        }

        mMap.setOnMarkerClickListener(new GoogleMap.OnMarkerClickListener() {
            @Override
            public boolean onMarkerClick(Marker marker) {

                if (bottomSheet != null)
                    bottomSheet.dismiss();
                Integer id = (Integer) marker.getTag();
                AirbnbRental current = rentalMap.get(id);
                mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(current.getLatLng(),
                        15f));
                bottomSheet = new BottomSheetDialog(current, favouriteAirbnbs, getApplicationContext());
                bottomSheet.show(getSupportFragmentManager(), "test");
                return false;
            }
        });

        mMap.setOnCameraIdleListener(new GoogleMap.OnCameraIdleListener() {
            @Override
            public void onCameraIdle() {
                VisibleRegion visibleRegion = mMap.getProjection().getVisibleRegion();
                farLeft = visibleRegion.farLeft;
                nearRight = visibleRegion.nearRight;

                String url = listingURL.concat("?xmin=").concat(Double.toString(farLeft.longitude)).concat("&xmax=").concat(Double.toString(nearRight.longitude)).concat("&ymin=").concat(Double.toString(nearRight.latitude)) + "&ymax=".concat(Double.toString(farLeft.latitude));

                if (filterData != null) {
                    url = url + "&minprice=" + filterData.getMinPrice()
                            + "&maxprice=" + filterData.getMaxPrice()
                            + "&minsafety=" + filterData.getMinSafetyIndex()
                            + "&maxsafety=" + filterData.getMaxSafetyIndex();
                }

                System.out.println(url);
                CustomRequest jsObjRequest = new CustomRequest(Request.Method.GET, url, null,
                        new Response.Listener<JSONObject>() {
                            @Override
                            public void onResponse(JSONObject response) {
                                System.out.println("RECEIVED RESPONSE" + response.toString());

                                try {
                                    JSONArray listings = response.getJSONArray("Listings");

                                    int numListings = listings.length();
                                    boolean flag = true;

                                    for (int i = 0; i < numListings; i++) {

                                        JSONObject current = listings.getJSONObject(i);

                                        LatLng coords = new LatLng(current.getDouble("lat"), current.getDouble("lng"));
                                        Integer id = current.getInt("id");

                                        if (!rentalMap.containsKey(id)) {

                                            if (flag) {
                                                flag = false;
                                                fireNotification(numListings);
                                            }

                                            String name = current.getString("name");
                                            double rating = current.getDouble("star_rating");
                                            int reviewCount = current.getInt("reviews_count");
                                            int capacity = current.getInt("person_capacity");
                                            String url = current.getJSONObject("picture").getString("picture");
                                            int safety_index = current.getInt("safetyIndex");
                                            int price = current.getJSONObject("pricing_quote").getJSONObject("rate").getInt("amount");

                                            BitmapDescriptor bitmap;

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

                                            Marker marker = mMap.addMarker(new MarkerOptions().position(coords)
                                                    .icon(bitmap));
                                            marker.setTag(id);

                                            rentalMarkers.add(marker);

                                            AirbnbRental rental = new AirbnbRental(id, coords, name, rating, reviewCount, capacity, url, safety_index, marker, price);

                                            rentalMap.put(id, rental);
                                        }

                                    }

                                } catch (JSONException e) {
                                    Toast.makeText(getApplicationContext(), "JSON Exception parsing Airbnb rental info!", Toast.LENGTH_SHORT).show();
                                    e.printStackTrace();
                                }
                            }
                        },
                        new Response.ErrorListener() {
                            @Override
                            public void onErrorResponse(VolleyError error) {
                                //Toast.makeText(getApplicationContext(), "Error: " + error.toString(), Toast.LENGTH_LONG).show();
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
                    }
                });

                VolleySingleton.getInstance(getApplicationContext()).addToRequestQueue(jsObjRequest);
            }
        });
    }

    private void userLocation() {
        LocationManager locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);

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
                        // System.out.println("RECEIVED RESPONSE" + response.toString());
//
                        try {
                            JSONObject coordinates = response.getJSONArray("results").getJSONObject(0).getJSONObject("geometry").getJSONObject("location");

                            mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(new LatLng(coordinates.getDouble("lat"), coordinates.getDouble("lng")),
                                    14));
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

        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                materialSearchBar.clearSuggestions();
            }
        },500);
    }

    private void createNotificationChannel() {
        // Create the NotificationChannel, but only on API 26+ because
        // the NotificationChannel class is new and not in the support library
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "SafeStay";
            String description = "Test";
            int importance = NotificationManager.IMPORTANCE_DEFAULT;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            // Register the channel with the system; you can't change the importance
            // or other notification behaviors after this
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private void getGoogleAccountInfo() {
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .build();

        GoogleSignInClient mGoogleSignInClient = GoogleSignIn.getClient(this, gso);

        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(MapsActivity.this);

        userId = account.getId();
        favouriteAirbnbs = new FavouriteAirbnbs(userId, getApplicationContext());

        //Toast.makeText(getApplicationContext(), userId, Toast.LENGTH_SHORT).show();
        //System.out.println(userId);
    }

    private BitmapDescriptor getMarkerIconFromDrawable(Drawable drawable) {
        Canvas canvas = new Canvas();
        Bitmap bitmap = Bitmap.createBitmap(drawable.getIntrinsicWidth(), drawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
        canvas.setBitmap(bitmap);
        drawable.setBounds(0, 0, drawable.getIntrinsicWidth(), drawable.getIntrinsicHeight());
        drawable.draw(canvas);

        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    private void fireNotification(int numRentals) {
        final Context context = this;
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

    /*@Override
    protected void onStop() {
        final Context context = this;

        if (!timerStarted) {
            timerStarted = true;
            if (!(searchedCity == "" || searchedCity == null))
                builder.setContentText("Don't wait! Book that Airbnb in " + searchedCity + "!");
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

        super.onStop();
    }

    @Override
    protected void onDestroy() {
        final Context context = this;

        if (!timerStarted) {
            timerStarted = true;
            if (!(searchedCity == "" || searchedCity == null))
                builder.setContentText("Don't wait! Book that Airbnb in " + searchedCity + "!");
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

        super.onDestroy();
    }*/
}