package com.cpen321.safestay;

import android.content.Context;

import androidx.test.espresso.IdlingPolicies;
import androidx.test.espresso.action.ViewActions;
import androidx.test.espresso.core.internal.deps.guava.collect.Maps;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.rule.ActivityTestRule;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject;
import androidx.test.uiautomator.UiSelector;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.TimeUnit;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.swipeDown;
import static androidx.test.espresso.action.ViewActions.swipeLeft;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import static androidx.test.platform.app.InstrumentationRegistry.getInstrumentation;
import static org.junit.Assert.*;

/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {

    @Rule
    public ActivityTestRule<MapsActivity> mapsActivityActivityTestRule = new ActivityTestRule<MapsActivity>(MapsActivity.class);

    @Test
    public void useAppContext() {
        // Context of the app under test.
        Context appContext = getInstrumentation().getTargetContext();

        assertEquals("com.cpen321.safestay", appContext.getPackageName());
    }
    // withId(R.id.my_view) is a ViewMatcher
    // click() is a ViewAction
    // matches(isDisplayed()) is a ViewAssertion
    @Test
    public void googleMapLoadView() {

        IdlingPolicies.setIdlingResourceTimeout(5, TimeUnit.SECONDS);
        IdlingPolicies.setMasterPolicyTimeout(5, TimeUnit.SECONDS);

        onView(withId(R.id.map))
                .perform(click())
                .check(matches(isDisplayed()));
    }

    @Test
    public void checkAirbnbLoaded() {

        onView(withId(R.id.map))
                .perform(ViewActions.swipeLeft())
                .check(matches(isDisplayed()));

        IdlingPolicies.setIdlingResourceTimeout(300, TimeUnit.MILLISECONDS);
        IdlingPolicies.setMasterPolicyTimeout(300, TimeUnit.MILLISECONDS);

        UiDevice device = UiDevice.getInstance(getInstrumentation());
        UiObject marker = device.findObject(new UiSelector().descriptionContains("this is a marker"));
        try {
            marker.click();
        } catch (Exception e) {
            System.out.println(e.toString());
        }
    }
}
