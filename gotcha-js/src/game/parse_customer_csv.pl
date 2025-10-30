# Open the csv file passed in as the first command line argument
# and parse the data into a hash of hashes.

use strict;
use warnings;

$file => $ARGV[0];
# Open the file and read the contents into a string
open(my $fh, '<:encoding(UTF-8)', $file)
  or die "Could not open file '$file' $!";
my $data = do { local $/; <$fh> };

# Split the string into lines
my @lines = split /\n/, $data;

# Loop through the lines
foreach my $line (@lines) {
  # Split the line into fields
  my @fields = split /,/, $line;

  # Create a hash of hashes
  my %hash = (
    'CustomerID' => $fields[0],
    'Name' => $fields[1],
    'Address' => $fields[2],
    'City' => $fields[3],
    'State' => $fields[4],
    'Zip' => $fields[5],
    'Phone' => $fields[6],
    'Email' => $fields[7],
    'Password' => $fields[8]
  );

    # Check if the zip has a 4-digit extension
    if (length($hash{'Zip'}) > 5) {
        # Split the zip into two parts
        my @zip = split /-/, $hash{'Zip'};
        # Check if the first part is 5 digits
        if (length($zip[0]) == 5) {
            # Set the zip to the first part
            $hash{'Zip'} = $zip[0];
        }
        # Check if the second part is 4 digits
        elsif (length($zip[1]) == 4) {
            # Set the zip to the second part
            $hash{'Zip'} = $zip[1];
        }
        # Otherwise, the zip is invalid
        else {
            # Print an error message
            print "Invalid zip code: $hash{'Zip'}\n";
        }
    }

    # Normalize the phone number to the standard format
    $hash{'Phone'} =~ s/[^0-9]//g;
    $hash{'Phone'} = "(" . substr($hash{'Phone'}, 0, 3) . ") " . substr($hash{'Phone'}, 3, 3) . "-" . substr($hash{'Phone'}, 6, 4);

    # Check if the email is valid
    if (!($hash{'Email'} =~ /^[\w\-\.]+\@[\w\-\.]+$/)) {
        # Print an error message
        print "Invalid email address: $hash{'Email'}\n";
    }

    # Check if the password is valid
    if (!($hash{'Password'} =~ /^[a-zA-Z0-9]+$/)) {
        # Print an error message
        print "Invalid password: $hash{'Password'}\n";
    }
    

