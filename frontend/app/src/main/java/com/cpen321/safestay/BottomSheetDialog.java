package com.cpen321.safestay;

import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ToggleButton;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.squareup.picasso.Picasso;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class BottomSheetDialog extends BottomSheetDialogFragment {

    private AirbnbRental rental;

    BottomSheetDialog(AirbnbRental rental) {
        this.rental = rental;
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

        /*View divider = v.findViewById(R.id.divider);
        divider.setBackgroundColor(textColour); */

        TextView capacity = v.findViewById(R.id.room_capacity);
        capacity.setText("Capacity: " + rental.getCapacity() + " Occupants");

        TextView rating = v.findViewById(R.id.rating);
        rating.setText(rental.getRating() + " Stars");

        TextView numReviews = v.findViewById(R.id.num_reviews);
        numReviews.setText(rental.getReviewCount() + " Reviews");

        /*ToggleButton favourite = v.findViewById(R.id.favourite);
        favourite.setChecked(false);*/

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
        Toast.makeText(getContext(), "Works!", Toast.LENGTH_SHORT);
        super.onCancel(dialog);
    }
}
