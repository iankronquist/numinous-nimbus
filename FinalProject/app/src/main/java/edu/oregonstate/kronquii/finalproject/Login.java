package edu.oregonstate.kronquii.finalproject;

import android.os.AsyncTask;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

public class Login extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        Button loginButton;
        Button signupButton;
        TextView statusText;
        final EditText passwordField;
        final EditText usernameField;

        loginButton = (Button) findViewById(R.id.loginButton);
        signupButton = (Button) findViewById(R.id.signupButton);
        statusText = (TextView)findViewById(R.id.statusText);
        usernameField = (EditText)findViewById(R.id.usernameField);
        passwordField = (EditText)findViewById(R.id.passwordField);


        loginButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Toast.makeText(Login.this, "Logging in...", Toast.LENGTH_LONG).show();
                new LoginTask().execute(usernameField.toString(), passwordField.toString());
            }
        });

        signupButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {

                Toast.makeText(Login.this, "Signing up...", Toast.LENGTH_LONG).show();
                new SignUpTask().execute(usernameField.toString(), passwordField.toString());
            }
        });
    }
}


class LoginTask extends AsyncTask<String, Void, Boolean> {
    protected Boolean doInBackground(String... files) {
        return true;
    }
}

class SignUpTask extends AsyncTask<String, Void, Boolean> {
    protected Boolean doInBackground(String... files) {
        return true;
    }
}