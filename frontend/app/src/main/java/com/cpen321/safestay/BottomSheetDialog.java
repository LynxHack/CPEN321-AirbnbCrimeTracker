package com.cpen321.safestay;

import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.media.Image;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.RatingBar;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ToggleButton;

import com.google.android.gms.maps.model.BitmapDescriptor;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.squareup.picasso.Picasso;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class BottomSheetDialog extends BottomSheetDialogFragment {

    private AirbnbRental rental;
    private FavouriteAirbnbs favouriteAirbnbs;
    private Context parentContext;
    private ToggleButton favourite;

    BottomSheetDialog(AirbnbRental rental, FavouriteAirbnbs favouriteAirbnbs, Context parentContext) {
        this.rental = rental;
        this.favouriteAirbnbs = favouriteAirbnbs;
        this.parentContext = parentContext;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.bottom_sheet_layout, container, false);

        ImageView image = v.findViewById(R.id.airbnb_image);
        Picasso.with(this.getContext()).load(rental.getURL()).into(image);

        int safetyIndex = rental.getSafetyIndex();
        int textColour;

        if (safetyIndex > 6)
            textColour = Color.GREEN;
        else if (safetyIndex > 4)
            textColour = Color.YELLOW;
        else textColour = Color.RED;

        TextView title = v.findViewById(R.id.sheet_title);
        title.setText(rental.getName());

        TextView price = v.findViewById(R.id.price);
        price.setText("$" + rental.getPrice() + "/night");

        TextView capacity = v.findViewById(R.id.room_capacity);
        capacity.setText("Capacity: " + rental.getCapacity() + " Occupants");

        RatingBar rating = v.findViewById(R.id.rating);
        rating.setRating((float) rental.getRating());

        TextView numReviews = v.findViewById(R.id.num_reviews);
        numReviews.setText(rental.getReviewCount() + " Reviews");

        favourite = v.findViewById(R.id.favourite);
        favourite.setChecked(favouriteAirbnbs.isFavourite(rental.getId()));

        Button book = v.findViewById(R.id.book);
        book.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // If wanna include certain filters...
                // https://www.airbnb.ca/rooms/33612621?adults=2&check_in=2019-12-04&check_out=2019-12-07
                String url = "https://www.airbnb.com/rooms/" + rental.getId();
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            }
        });

        return v;
    }

    @Override
    public void onCancel(DialogInterface dialog) {
        // Toast doesn't appear but this works - Replace with favourite logic
        Integer rentalId = rental.getId();
        if (!favouriteAirbnbs.isFavourite(rentalId) && favourite.isChecked()) {
            favouriteAirbnbs.addFavourite(rentalId, this.getContext());

            Drawable drawable = getResources().getDrawable(R.drawable.ic_star_favourite);
            BitmapDescriptor icon = getMarkerIconFromDrawable(drawable);

            rental.getMarker().setIcon(icon);
        }
        else if (favouriteAirbnbs.isFavourite(rentalId) && !favourite.isChecked()) {
            favouriteAirbnbs.removeFavourite(rentalId, this.getContext());

            float colour;
            int safetyIndex = rental.getSafetyIndex();
            if (safetyIndex > 6)
                colour = BitmapDescriptorFactory.HUE_GREEN;
            else if (safetyIndex > 4)
                colour = BitmapDescriptorFactory.HUE_YELLOW;
            else colour = BitmapDescriptorFactory.HUE_RED;

            rental.getMarker().setIcon(BitmapDescriptorFactory.defaultMarker(colour));
        }
        Toast.makeText(parentContext, "Works!", Toast.LENGTH_SHORT);
        super.onCancel(dialog);
    }

    private BitmapDescriptor getMarkerIconFromDrawable(Drawable drawable) {
        Canvas canvas = new Canvas();
        Bitmap bitmap = Bitmap.createBitmap(drawable.getIntrinsicWidth(), drawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
        canvas.setBitmap(bitmap);
        drawable.setBounds(0, 0, drawable.getIntrinsicWidth(), drawable.getIntrinsicHeight());
        drawable.draw(canvas);

        /*Bitmap withBorder = Bitmap.createBitmap(bitmap.getWidth() + 2, bitmap.getHeight() + 2, bitmap.getConfig());
        canvas = new Canvas(withBorder);
        canvas.drawColor(Color.WHITE);
        canvas.drawBitmap(bitmap, 1, 1, null);*/

        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }
}
